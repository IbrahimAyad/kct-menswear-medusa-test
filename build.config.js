// Railway build configuration
// This file forces Railway to build from repository root
module.exports = {
  root: '.',
  builder: 'nixpacks',
  buildCommand: 'npm install && npm run build',
  startCommand: 'npm start'
}