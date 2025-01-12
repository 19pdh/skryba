/**
 * ### Description
 * This function extracts id from Google Drive link
 *
 * @param {String} url Link to file on Google Drive
 * @return {Object} Object containing blob with generated PDF and url to source file
 */
function getIdFromUrl(url) { 
  return url.match(/[-\w]{25,}(?!.*[-\w]{25,})/);
}

/**
 * ### Description
 * This function will check if template file is a valid one and then run pdf generation procedure
 *
 * @param {String} templateUrl Link to template file on Google Drive
 * @param {Object} values Dictionary-like structure containing values to be written
 * @return {Object} Object containing blob with generated PDF and url to source file
 */
async function generatePDF(templateUrl, values) {
  if (!templateUrl) { throw new Error("templateUrl is not defined") }
  const templateFile = DriveApp.getFileById(getIdFromUrl(templateUrl))
  const fileType = templateFile.getMimeType()
  const isDocs = (fileType === "application/vnd.google-apps.document")
  if (isDocs) {
    return await generatePDFFromDocs(templateFile, values)
  } else {
    throw new Error("Unrecognized file format")
  }
}

/**
 * ### Description
 * This function will create new document and return PDF blob and url to source file, which will be deleted
 *
 * @param {Drive.File} templateFile Template file to generate PDF from
 * @param {Object} values Dictionary-like structure containing values to be written
 * @return {Object} Object containing blob with generated PDF and url to source file
 */
async function generatePDFFromDocs(templateFile, values) {
  const newFile = templateFile.makeCopy("Google Templater Copy");
  fillTemplate(newFile, values)
  newFile.setTrashed(true)
  return {
    blob: newFile.getAs('application/pdf'),
    url: newFile.getUrl()
  }
}

/**
 * ### Description
 * This function will replace strings like '{{name}}' with corresponding values from `values`
 *
 * @param {Drive.File} newFile New file copied from template, will be overwritten
 * @param {Object} values Dictionary-like structure containing values to be written
 */
function fillTemplate(newFile, values) {
  const newDoc = DocumentApp.openById(newFile.getId())
  const body = newDoc.getBody()
  for (let [ name, value ] of Object.entries(values)) {
    if (value instanceof Date) {
      value = value.toLocaleDateString("pl-PL");
    }
    body.replaceText(`{{${name}}}`, value)
  }
  newDoc.saveAndClose()
}
