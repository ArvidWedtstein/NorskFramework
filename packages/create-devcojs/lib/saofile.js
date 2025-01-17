const { dirname, join, relative } = require('path')

const fs = require('fs')
const pkg = require('./package')
const cnaTemplateDir = join(dirname(require.resolve('../../cna-template/package.json')))
const templateDir = join(cnaTemplateDir, 'template')

const addExecutable = filename => new Promise(
  resolve => fs.chmod(filename, 0o755, resolve)
)


module.exports = {
  prompts: require('./prompts'),
  templateData () {
    const pm = this.answers.pm === 'yarn' ? 'yarn' : 'npm'
    const pmRun = this.answers.pm === 'yarn' ? 'yarn' : 'npm run'
    const { cliOptions = {} } = this.sao.opts

    return {
      pm,
      pmRun
    }
  },
  actions () {
    const actions = [{
      type: 'add',
      files: '**',
      templateDir: join(templateDir, 'devco')
    }]

    actions.push({
      type: 'move',
      patterns: {
        gitignore: '.gitignore',
        '_package.json': 'package.json',
        '_.prettierignore': '.prettierignore',
        '_.prettierrc': '.prettierrc'
      }
    })

    const generator = this
    actions.push({
      type: 'modify',
      files: 'package.json',
      handler (data) {
        return { ...data, ...pkg.load(generator) }
      }
    })

    // For compiling package.json
    actions.push({
      type: 'add',
      files: 'package.json',
      templateDir: this.outDir
    })

    actions.push({
      type: 'remove',
      files: 'package.js'
    })
    return actions
  },
  async completed () {
    if (this.answers.vcs === 'git') {
      this.gitInit()
    }


    await this.npmInstall({ npmClient: this.answers.pm })


    const chalk = this.chalk
    const isNewFolder = this.outDir !== process.cwd()
    const relativeOutFolder = relative(process.cwd(), this.outDir)
    const cdMsg = isNewFolder ? chalk`\t{cyan cd ${relativeOutFolder}}\n` : ''
    const pmRun = this.answers.pm === 'yarn' ? 'yarn' : 'npm run'

    console.log(chalk`\n🎉✓  {bold Prosjektet blei opprettet} {cyan ${this.answers.name}}\n`)

  }
}