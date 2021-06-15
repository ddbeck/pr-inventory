const Airtable = require("airtable");

const github = require("./github");

const base = Airtable.base(process.env.AIRTABLE_BASE_ID);
const table = base(process.env.AIRTABLE_BASE_TABLE || "Table 1");

async function main() {
  // Get all of the open pulls from GitHub
  const openPulls = await github.openPulls();
  const openPullNumbers = openPulls.map((p) => p.number);

  // Get all of the records for Airtable
  const records = await table.select().all();
  const recordPullNumbers = await records.map((r) => r.get("Pull"));

  // Closed pull requests are assumed to be pull requests known to Airtable
  // records but not in the set of open pull requests according to GitHub
  const closedPullNumbers = recordPullNumbers.filter(
    (num) => !openPullNumbers.includes(num)
  );

  // New pull requests are those unknown to Airtable records
  const newPullNumbers = openPullNumbers.filter(
    (num) => !recordPullNumbers.includes(num)
  );

  // Putatively updated pull requests are pull requests known to both Airtable
  // records and the set of open pull requests according to GitHub
  const updatedPullNumbers = openPullNumbers.filter(
    (num) => !newPullNumbers.includes(num) && !closedPullNumbers.includes(num)
  );

  console.log(`Pulls to add: ${newPullNumbers.length}`);
  await createRecords(
    table,
    newPullNumbers
      .map((num) => openPulls.find((p) => p.number === num))
      .map((pullData) => pullDataToRecord(pullData))
  );

  console.log(`Pulls to update: ${updatedPullNumbers.length}`);
  const updates = updatedPullNumbers.map((toUpdate) =>
    prepareUpdate(
      toUpdate,
      openPulls.find((p) => p.number === toUpdate),
      records
    )
  );
  await updateRecords(table, updates);

  console.log(`Pulls to remove: ${closedPullNumbers.length}`);
  const recordsToDestroy = closedPullNumbers.map((pullNumber) =>
    records.find((r) => r.get("Pull") === pullNumber)
  );
  const recordIdsToDestroy = recordsToDestroy.map((r) => r.id);
  await destroyRecords(table, recordIdsToDestroy);
}

/**
 * Convert a pull request object into an Airtable record object
 */
function pullDataToRecord(pullData, id) {
  const newRecord = {
    fields: {
      Pull: pullData.number,
      "GitHub:author": pullData.user.login,
      "GitHub:author_association": pullData.author_association,
      "GitHub:title": pullData.title,
      "GitHub:labels": pullData.labels.map((label) => label.name),
    },
  };

  if (id !== undefined) {
    newRecord.id = id;
  }

  return newRecord;
}

function updateRecords(table, records) {
  return processWindow(table.update, records, { typecast: true });
}

function createRecords(table, records) {
  return processWindow(table.create, records, { typecast: true });
}

function destroyRecords(table, recordIds) {
  return processWindow(table.destroy, recordIds);
}

function prepareUpdate(pullNumber, pullData, originalRecords) {
  const record = originalRecords.find((r) => r.get("Pull") === pullNumber);
  return pullDataToRecord(pullData, record.id);
}

/**
 * Run an Airtable method on many records, even if they exceed Airtable's
 * per-request maximum.
 *
 * @param {*} fn - a function to call against records (e.g., `table.update`)
 * @param {*} records - an iterable of Airtable record object (e.g., the first argument to `table.update`)
 * @param {*} options - options argument to the function (e.g., `{ typecast: true` })
 * @param {number} [maxRecords=10]
 */
async function processWindow(fn, records, options, maxRecords = 10) {
  const wrapFn = (win) => (options ? fn(win, options) : fn(win));

  let window = [];

  for (const record of records) {
    if (window.length === maxRecords) {
      await wrapFn(window);
      window = [];
    }
    window.push(record);
  }
  if (window.length > 0) {
    await wrapFn(window);
  }
}

main()
  .then(() => console.log(""))
  .catch((err) => {
    console.trace(err);
  });
