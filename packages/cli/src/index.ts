import { Command } from 'commander'
import { analyzeDependencies } from './analyze'

const program = new Command()

program
  .name('dep-chedker')
  .version('0.0.1')
  .description('Analyze package.json for missing dependencies')
  .option('-p, --path <path>', 'Path to package.json', './package.json')
  .action((options) => {
    analyzeDependencies(options.path)
  })

program.parse(process.argv)
