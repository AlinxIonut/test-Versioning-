const generateDiffLink = (owner, repo, lastRelease, nextRelease) => {
    if (lastRelease && lastRelease.gitTag && nextRelease && nextRelease.gitTag) {
      return `\n\n[Vizualizați toate modificările](https://github.com/${owner}/${repo}/compare/${lastRelease.gitTag}...${nextRelease.gitTag})`;
    }
    return '';
  };
  
  module.exports = {
    branches: ['main'],
    plugins: [
      '@semantic-release/commit-analyzer',
      ['@semantic-release/release-notes-generator', {
        writerOpts: {
          transform: (commit, context) => {
            const issues = [];
  
            if (commit.type === 'feat') {
              commit.type = 'Features';
            } else if (commit.type === 'fix') {
              commit.type = 'Bug Fixes';
            } else if (commit.type === 'perf') {
              commit.type = 'Performance Improvements';
            } else if (commit.type === 'revert' || commit.revert) {
              commit.type = 'Reverts';
            } else if (commit.type === 'docs') {
              commit.type = 'Documentation';
            } else if (commit.type === 'style') {
              commit.type = 'Styles';
            } else if (commit.type === 'refactor') {
              commit.type = 'Code Refactoring';
            } else if (commit.type === 'test') {
              commit.type = 'Tests';
            } else if (commit.type === 'build') {
              commit.type = 'Build System';
            } else if (commit.type === 'ci') {
              commit.type = 'Continuous Integration';
            }
  
            if (commit.scope === '*') {
              commit.scope = '';
            }
  
            if (typeof commit.hash === 'string') {
              commit.shortHash = commit.hash.substring(0, 7);
            }
  
            if (typeof commit.subject === 'string') {
              let url = context.repository 
                ? `${context.host}/${context.owner}/${context.repository}`
                : context.repoUrl;
              if (url) {
                url = `${url}/issues/`;
                // Issue URLs.
                commit.subject = commit.subject.replace(/#([0-9]+)/g, (_, issue) => {
                  issues.push(issue);
                  return `[#${issue}](${url}${issue})`;
                });
              }
              if (context.host) {
                // User URLs.
                commit.subject = commit.subject.replace(/\B@([a-z0-9](?:-?[a-z0-9/]){0,38})/g, (_, username) => {
                  if (username.includes('/')) {
                    return `@${username}`;
                  }
                  return `[@${username}](${context.host}/${username})`;
                });
              }
            }
  
            // remove references that already appear in the subject
            commit.references = commit.references.filter(reference => {
              if (issues.indexOf(reference.issue) === -1) {
                return true;
              }
              return false;
            });
  
            return commit;
          },
          groupBy: 'type',
          commitGroupsSort: ['Features', 'Bug Fixes', 'Performance Improvements', 'Reverts', 'Documentation', 'Styles', 'Code Refactoring', 'Tests', 'Build System', 'Continuous Integration'],
          noteGroupsSort: ['BREAKING CHANGES']
        },
      }],
      ['@semantic-release/changelog', {
        changelogFile: 'CHANGELOG.md',
      }],
      '@semantic-release/npm',
      ['@semantic-release/git', {
        assets: ['package.json', 'CHANGELOG.md'],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
      }],
      ['@semantic-release/github', {
        successComment: false,
        failComment: false,
        releaseNameTemplate: "Release ${nextRelease.version}",
        releasedLabels: ["released"],
        addReleases: "bottom"
      }]
    ],
    generateNotes: {
      preset: 'angular',
      writerOpts: {
        finalizeContext: (context, writerOpts, filteredCommits, keyCommit, originalCommits) => {
          const owner = process.env.GITHUB_REPOSITORY.split('/')[0];
          const repo = process.env.GITHUB_REPOSITORY.split('/')[1];
          context.diffLink = generateDiffLink(owner, repo, context.lastRelease, context.nextRelease);
          return context;
        },
        commitPartial: `*{{#if scope}} **{{scope}}:**
  {{~/if}} {{#if subject}}
    {{~subject}}
  {{~else}}
    {{~header}}
  {{~/if}}
  
  {{~!-- commit link --}}{{#if hash}} {{#if @root.linkReferences~}}
    ([{{shortHash}}]({{commitUrlFormat}}))
  {{~else}}
    {{shortHash}}
  {{~/if}}{{~/if}}
  
  {{~!-- commit references --}}
  {{~#if references~}}
    , closes
    {{~#each references}} {{#if @root.linkReferences~}}
      [
      {{~#if this.owner}}
        {{~this.owner}}/
      {{~/if}}
      {{~this.repository}}#{{this.issue}}]({{issueUrlFormat}})
    {{~else}}
      {{~#if this.owner}}
        {{~this.owner}}/
      {{~/if}}
      {{~this.repository}}#{{this.issue}}
    {{~/if}}{{/each}}
  {{~/if}}
  
  `,
        mainTemplate: `{{> header}}
  
  {{#each commitGroups}}
  
  {{#if title}}
  ### {{title}}
  
  {{/if}}
  {{#each commits}}
  {{> commit root=@root}}
  {{/each}}
  
  {{/each}}
  {{#if noteGroups}}
  {{#each noteGroups}}
  
  ### {{title}}
  
  {{#each notes}}
  * {{#if commit.scope}}**{{commit.scope}}:** {{/if}}{{text}}
  {{/each}}
  {{/each}}
  {{/if}}
  
  {{#if @root.diffLink}}
  {{@root.diffLink}}
  {{/if}}
  `
      }
    }
  };