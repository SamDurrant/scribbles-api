function makeNotesArray() {
  return [
    {
      id: 1,
      name: 'Paris',
      content:
        'Lorem ipsum dolor sit amet consectetur adipisicing elit. Sit, laudantium.',
      date_created: new Date().toISOString(),
      folder_id: 1,
    },
    {
      id: 2,
      name: 'Tokyo',
      content:
        'Lorem ipsum dolor sit amet consectetur adipisicing elit. Sit, laudantium.',
      date_created: new Date().toISOString(),
      folder_id: 1,
    },
    {
      id: 3,
      name: 'Lisbon',
      content:
        'Lorem ipsum dolor sit amet consectetur adipisicing elit. Sit, laudantium.',
      date_created: new Date().toISOString(),
      folder_id: 2,
    },
    {
      id: 4,
      name: 'Denver',
      content:
        'Lorem ipsum dolor sit amet consectetur adipisicing elit. Sit, laudantium.',
      date_created: new Date().toISOString(),
      folder_id: 3,
    },
  ]
}

function makeMaliciousNotes() {
  const maliciousNote = {
    id: 4,
    name: 'Denver',
    content:
      'my <script>alert("xss");</script> folder <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">',
    date_created: new Date().toISOString(),
    folder_id: 3,
  }

  const expectedNote = {
    id: 4,
    name: 'Denver',
    content:
      'my &lt;script&gt;alert("xss");&lt;/script&gt; folder <img src="https://url.to.file.which/does-not.exist">',
    date_created: new Date().toISOString(),
    folder_id: 3,
  }
}

module.exports = {
  makeNotesArray,
  makeMaliciousNotes,
}
