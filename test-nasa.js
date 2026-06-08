const q = 'jupiter venus';
fetch(`https://images-api.nasa.gov/search?q=${encodeURIComponent(q)}&media_type=image`)
  .then(r => r.json())
  .then(data => {
    const items = data.collection.items;
    if (items && items.length > 0) {
      console.log(items[0].links[0].href);
    } else {
      console.log('No results');
    }
  }).catch(console.error);
