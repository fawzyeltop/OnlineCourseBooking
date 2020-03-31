#Install
```
# In your scotch directory:
npm install scotch-formatter-readmore

# Now add it to your config:
vim config/environment.js
```

##Sample Configuration
```js
var config = {
  port: 80,
  model: {
    defaultAdapter: 'mongo'
  },
  db: {
    mongo: {
      dbname: 'blog'
    }
  },
  plugins: {
    formatters: [
      'readmore'
    ]
  }
};

module.exports = config;
```
