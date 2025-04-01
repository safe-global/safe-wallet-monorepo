/**
 * Generic jscodeshift transformer that can be used with different mapping configurations
 * to update imports and type references across the codebase.
 *
 * To use this transformer, create a mappings object with the following properties:
 * - importMapping: Object mapping old imports to new module/name pairs
 * - enumLiteralMappings: Object mapping enum names to their literal values
 * - sourcePackage: String identifying the source package to transform
 * 
 * then pass the mappings object to the transformer.
 */
export default function createTransformer(mappings) {
  return function transformer(file, api) {
    if (!file.source.includes(mappings.sourcePackage)) {
      return file.source
    }

    const j = api.jscodeshift
    const root = j(file.source)

    const newImportsMap = new Map()
    const importsToRemove = []

    // Replace enum references with literals based on the configurable mapping
    Object.entries(mappings.enumLiteralMappings).forEach(([enumName, enumMappings]) => {
      root.find(j.MemberExpression, { object: { name: enumName } }).forEach((path) => {
        const propName = path.node.property.name
        if (enumMappings[propName]) {
          const newNode = j.tsAsExpression(
            j.stringLiteral(enumMappings[propName]),
            j.tsTypeReference(j.identifier('const'))
          )
          j(path).replaceWith(newNode)
        }
      })
    })

    // Transform imports
    root
      .find(j.ImportDeclaration, { source: { value: mappings.sourcePackage } })
      .forEach((path) => {
        const baseImportKind = path.node.importKind || 'value'
        const transformedSpecifiers = []

        path.node.specifiers.forEach((specifier) => {
          if (specifier.type !== 'ImportSpecifier') return

          const importedName = specifier.imported.name
          const mapping = mappings.importMapping[importedName]
          if (!mapping) return

          const specifierImportKind = specifier.importKind || baseImportKind
          const key = `${mapping.module}|${specifierImportKind}`
          if (!newImportsMap.has(key)) newImportsMap.set(key, [])

          const localName = specifier.local.name !== importedName ? specifier.local.name : undefined
          if (localName) {
            newImportsMap.get(key).push(j.importSpecifier(j.identifier(mapping.newName), j.identifier(localName)))
          } else {
            newImportsMap.get(key).push(j.importSpecifier(j.identifier(mapping.newName)))
          }

          transformedSpecifiers.push(specifier)
        })

        if (transformedSpecifiers.length === path.node.specifiers.length) {
          importsToRemove.push(path)
        } else {
          path.node.specifiers = path.node.specifiers.filter((spec) => !transformedSpecifiers.includes(spec))
        }
      })

    importsToRemove.forEach((p) => j(p).remove())

    // Add new imports
    newImportsMap.forEach((specifiers, key) => {
      const [module, importKind] = key.split('|')
      const importDecl = j.importDeclaration(specifiers, j.literal(module))
      if (importKind === 'type') importDecl.importKind = 'type'
      root.get().node.program.body.unshift(importDecl)
    })

    // Replace types in angle-bracket assertions
    root.find(j.TSTypeAssertion).forEach((path) => {
      const typeName = path.node.typeAnnotation.typeName?.name
      if (typeName && mappings.importMapping[typeName]) {
        path.node.typeAnnotation.typeName.name = mappings.importMapping[typeName].newName
      }
    })

    // Replace type references
    root.find(j.TSTypeReference).forEach((path) => {
      const typeName = path.node.typeName?.name
      if (typeName && mappings.importMapping[typeName]) {
        path.node.typeName.name = mappings.importMapping[typeName].newName
      }
    })

    // Remove empty import declarations
    root
      .find(j.ImportDeclaration)
      .filter((path) => path.node.specifiers.length === 0)
      .forEach((path) => {
        j(path).remove()
      })

    return root.toSource({ quote: 'single', trailingComma: true })
  }
} 