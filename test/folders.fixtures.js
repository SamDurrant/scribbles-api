function makeFoldersArray() {
  return [
    {
      id: 1,
      name: 'Nouns',
    },
    {
      id: 2,
      name: 'Adjectives',
    },
    {
      id: 3,
      name: 'Verbs',
    },
  ]
}

function makeMaliciousFolder() {
  const maliciousFolder = {
    id: 123,
    name: `my <script>alert("xss");</script> folder <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">`,
  }
  const expectedFolder = {
    id: 123,
    name: `my &lt;script&gt;alert("xss");&lt;/script&gt; folder <img src="https://url.to.file.which/does-not.exist">`,
  }
  return {
    maliciousFolder,
    expectedFolder,
  }
}

module.exports = {
  makeFoldersArray,
  makeMaliciousFolder,
}
