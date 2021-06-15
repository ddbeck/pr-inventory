## Before you begin

To run the script, you'll need the following:

- Node.js 14 or newer
- An [Airtable](https://airtable.com/) account (a free account will work)
- A GitHub personal access token (see [_Creating a personal access token_](https://docs.github.com/en/github/authenticating-to-github/keeping-your-account-and-data-secure/creating-a-personal-access-token))

## Set up a table in Airtable

The script expects that you have an Airtable base with a table containing the following field names and types:

| Name                        | Type                          |
| --------------------------- | ----------------------------- |
| `Pull`                      | (🔐 **Primary field**) Number |
| `GitHub:title`              | Single line text              |
| `GitHub:author`             | Single line text              |
| `GitHub:labels`             | Multiple select               |
| `GitHub:author_association` | Single line text              |
| `GitHub:title `             | Single line text              |
| `GitHub:title `             | Single line text              |

You can have other fields and the script will not modify them, but the script _will_ delete records for pull requests which have closed. Don't keep anything precious in extra fields; I can't be held responsible if it goes missing.

## Configure Environment variables

Set the following environment variables:

| Variable                       | Description                                                         | Default   |
| ------------------------------ | ------------------------------------------------------------------- | --------- |
| `AIRTABLE_API_KEY`             | Your Airtable API key (in Airtable, see _Help → API documentation_) |           |
| `AIRTABLE_BASE_ID`             | Your Airtable API key (in Airtable, see _Help → API documentation_) |           |
| `AIRTABLE_BASE_TABLE`          | The name of the Airtable base                                       | `Table 1` |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | Your GitHub API personal access token                               |           |
| `GITHUB_REPO_OWNER`            | The repository owner or organization (e.g., `ddbeck` or `mdn`)      |           |
| `GITHUB_REPO_NAME`             | The repository name (e.g., `browser-compat-data`)                   |           |

I recommend using [`direnv`](https://direnv.net/) to manage your per-project environment variables.

## Install dependencies

Run `npm install`.

## Run the script

Run `npm run update`. It will take a few minutes to finish. If you want to see progress from GitHub API calls, set `NODE_DEBUG=pr-inventory` in your environment.

Rerun the script whenever you want to bring in new PRs or remove closed PRs.
