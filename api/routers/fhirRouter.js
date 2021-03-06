const express = require('express');
const fhir = require('../handlers/fhirHandler');

const FHIRRouter = express.Router();

FHIRRouter.route('/search')
  .get(fhir.searchForValueSets);

FHIRRouter.route('/vs/:id')
  .get(fhir.getValueSet);

module.exports = FHIRRouter;
