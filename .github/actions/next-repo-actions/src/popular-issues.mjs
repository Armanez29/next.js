// @ts-check
import { context, getOctokit } from '@actions/github'
import { info, setFailed } from '@actions/core'
import { WebClient } from '@slack/web-api'
import { formattedDate } from '../lib/util.mjs'

// function generateBlocks(issues) {
//   const blocks = [
//     {
//       type: 'section',
//       text: {
//         type: 'mrkdwn',
//         text: '*A list of the top 15 issues sorted by the most reactions over the last 90 days.*\n_Note: This :github2: <https://github.com/vercel/next.js/blob/canary/.github/workflows/popular.yml|workflow> → <https://github.com/vercel/next.js/blob/canary/.github/actions/next-repo-info/src/popular-issues.mjs|action> will run every Monday at 10AM UTC (6AM EST). These issues are automatically synced to Linear._',
//       },
//     },
//     {
//       type: 'divider',
//     },
//   ]

//   let text = ''

//   issues.forEach((issue, i) => {
//     text += `${i + 1}. [<${issue.html_url}|#${issue.number}>, ${
//       issue.reactions.total_count
//     } reactions, ${formattedDate(issue.created_at)}]: ${issue.title}\n`
//   })

//   blocks.push({
//     type: 'section',
//     text: {
//       type: 'mrkdwn',
//       text: text,
//     },
//   })

//   return blocks
// }

async function run() {
  try {
    if (!process.env.GITHUB_TOKEN) throw new TypeError('GITHUB_TOKEN not set')
    // if (!process.env.SLACK_TOKEN) throw new TypeError('SLACK_TOKEN not set')

    const octoClient = getOctokit(process.env.GITHUB_TOKEN)
    // const slackClient = new WebClient(process.env.SLACK_TOKEN)

    const { owner, repo } = context.repo
    const { data } = await octoClient.rest.search.issuesAndPullRequests({
      order: 'desc',
      q: `repo:${owner}/${repo} is:issue created:>=2024-07-15`,
    })

    info(`issues length = ${data.items.length}`)
    info(`issues = ${JSON.stringify(data.items)}`)

    // if (data.items.length > 0) {
    //   data.items.forEach(async (item) => {
    //     await octoClient.rest.issues.addLabels({
    //       owner,
    //       repo,
    //       issue_number: item.number,
    //       labels: ['linear: next'],
    //     })
    //   })

    //   await slackClient.chat.postMessage({
    //     blocks: generateBlocks(data.items),
    //     channel: '#next-info',
    //     icon_emoji: ':github:',
    //     username: 'GitHub Notifier',
    //   })

    //   info(`Posted to Slack!`)
    // } else {
    //   info(`No popular issues`)
    // }
  } catch (error) {
    setFailed(error)
  }
}

run()
