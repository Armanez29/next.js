// Return attributes and values of a node in a convenient way:
/* example: 
    <ExampleElement attr1="15" attr2>
    {   attr1: {
            hasValue: true,
            value: 15
        },
        attr2: {
            hasValue: false
        }
Inclusion of hasValue is in case an eslint rule cares about boolean values
explicitely assigned to attribute vs the attribute being used as a flag
*/
class NodeAttributes {
  constructor(ASTnode) {
    this.attributes = {}
    ASTnode.attributes.forEach((attribute) => {
      this.attributes[attribute.name.name] = {
        hasValue: !!attribute.value,
      }
      if (attribute.value) {
        this.attributes[attribute.name.name].value = attribute.value.value
      }
    })
  }
  has(attrName) {
    return !!this.attributes[attrName]
  }
  value(attrName) {
    if (!this.attributes[attrName]) {
      return true
    }
    return this.attributes[attrName].value
  }
}

module.exports = NodeAttributes
