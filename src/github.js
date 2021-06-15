const { Octokit } = require("@octokit/rest");

const { debuglog } = require("util");

const debug = debuglog("pr-inventory");

const die = () => {
  throw Error("GITHUB_PERSONAL_ACCESS_TOKEN not set");
};

const TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN.length
  ? process.env.GITHUB_PERSONAL_ACCESS_TOKEN
  : die();

const { GITHUB_REPO_NAME, GITHUB_REPO_OWNER } = process.env;

const octokit = new Octokit({ auth: TOKEN });

function getPull(number) {
  return octokit.pulls.get({
    owner: "mdn",
    repo: "browser-compat-data",
    pull_number: number,
  });
}

async function* __openPulls() {
  const allOpenPullsEndpoint = octokit.pulls.list.endpoint.merge({
    owner: GITHUB_REPO_OWNER,
    repo: GITHUB_REPO_NAME,
    state: "open",
    direction: "asc",
  });
  const openPullsIterator = octokit.paginate.iterator(allOpenPullsEndpoint);

  debug(`Fetching open pulls`);
  let page = 0;
  for await (const response of openPullsIterator) {
    page += 1;
    debug(`Received responses, page`, page);
    yield* response.data;
  }
}

async function openPulls() {
  const pulls = [];
  for await (const pull of __openPulls()) {
    pulls.push(pull);
  }
  return pulls;
}

module.exports = {
  getPull,
  openPulls,
};
