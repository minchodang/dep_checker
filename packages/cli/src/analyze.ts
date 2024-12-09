import fs from 'fs'
import path from 'path'

const contextSpecificDependencies: Record<string, string[]> = {
  'next/image': ['sharp'],
  'next/font': ['@next/font'],
}

export function analyzeDependencies(packageJsonPath: string) {
  const fullPath = path.resolve(packageJsonPath)

  if (!fs.existsSync(fullPath)) {
    console.error(`Error: File not found at ${fullPath}`)
    process.exit(1)
  }

  const packageJson = JSON.parse(fs.readFileSync(fullPath, 'utf-8'))
  const { dependencies = {}, devDependencies = {} } = packageJson

  const allDeps = { ...dependencies, ...devDependencies }
  const missingDeps: string[] = []

  Object.keys(allDeps).forEach((dep) => {
    if (!fs.existsSync(path.resolve('node_modules', dep))) {
      missingDeps.push(dep)
    }
  })

  const contextMissingDeps = checkContextSpecificDependencies(allDeps)

  if (missingDeps.length > 0 || contextMissingDeps.length > 0) {
    console.warn('The following packages are missing:')

    if (missingDeps.length > 0) {
      missingDeps.forEach((dep) => console.warn(`- ${dep} (declared)`))
    }

    if (contextMissingDeps.length > 0) {
      contextMissingDeps.forEach((dep) => console.warn(`- ${dep} (required by usage)`))
    }

    process.exit(1)
  } else {
    console.log('All dependencies are installed.')
  }
}

function checkContextSpecificDependencies(installedDeps: Record<string, string>): string[] {
  const missing: string[] = []

  for (const [context, requiredDeps] of Object.entries(contextSpecificDependencies)) {
    if (fs.existsSync(path.resolve('node_modules', context.split('/')[0]))) {
      requiredDeps.forEach((dep) => {
        if (!installedDeps[dep] && !fs.existsSync(path.resolve('node_modules', dep))) {
          missing.push(dep)
        }
      })
    }
  }

  return missing
}
