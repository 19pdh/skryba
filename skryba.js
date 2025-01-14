// TODO: change this to your email
const MAINTAINER = "patryk.niedzwiedzinski@zhr.pl";

const RESPONSE_SHEET = "form";
const SETTINGS_SHEET = "settings";

const MAIL_TITLE = "[Skryba] Uzupełniony plik";
const mailBody = submitter => `Formularz uzupełniony przez: ${submitter}`;

/**
 * ### Description
 * The main function triggered by form submision
 *
 * @param {Object} e Event information
 */
async function onFormSubmit(e) {
  try {
    Logger.log(e.namedValues)
    const rowNumber = e.range.getRow()
    const response = getFormResponse(rowNumber);
    const submitter = getSubmitter(response);
  
    const settings = getSettings();
  
    const { pdfBlob, googleDocsFileUrl } = await generatePDF(settings, response);

    sendFile(settings.sendTo, pdfBlob, submitter, googleDocsFileUrl);

    updateRow(
      rowNumber,
      [ { name: "file", value: googleDocsFileUrl } ]
    )

  } catch(err) {
    errorHandler(err, e)
  }
}

/**
 * ### Description
 * This function will parse the form submission based on the headers in Google Sheet
 *
 * @param {Number} rowNumber Row number to get data from
 * @return {Array} Array of object with parameters `name` and `value`
 */
function getFormResponse(rowNumber) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(RESPONSE_SHEET);
  const [ headers ] = sheet.getDataRange().getDisplayValues()
  return headers.map((label, idx) => ({ 
    name: label, 
    value: sheet.getRange(rowNumber, idx+1).getValue()
  }))
}

/**
 * ### Description
 * This function will parse the values in settings sheet
 *
 * @return {Object} Key-value object of settings parameters
 */
function getSettings() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SETTINGS_SHEET)
  const data = sheet.getDataRange().getValues()
  let settings = {}
  for(let row of data) {
    settings[row[0]] = row[1]
  }
  return settings
}

/**
 * ### Description
 * Update the value in row of given number in column with given header
 *
 * @param {Number} rowNumber Number of row
 * @param {Array} entry Array of object with properties `name` and `value`
 */
function updateRow(rowNumber, entry) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(RESPONSE_SHEET);
  const [ headers ] = sheet.getDataRange().getDisplayValues();
  for (let { name, value } of entry) {
    const columnIndex = headers.indexOf(name)
    if (columnIndex == -1) {
      throw new Error(`The label ${name} was not found in document`)
    }
    sheet.getRange(rowNumber, columnIndex+1).setValue(value)
  }
}

/**
 * ### Description
 * This function will send the PDF blob file
 *
 * @param {String} sendTo Email address
 * @param {Object} blob PDF blob object
 * @param {String} submitter Email address of form submitter
 * @param {String} fileUrl Optional fileUrl to append to mail body
 */
function sendFile(sendTo, blob, submitter, fileUrl=undefined) {
  const options = {
    name: "Skryba",
    replyTo: sendTo,
    attachments : {
      'fileName' : `${generateFileName(submitter)}.pdf`,
      'mimeType' : 'application/pdf',
      'content' : blob.getBytes()
    }
  }
  MailApp.sendEmail(
    sendTo,
    MAIL_TITLE, 
    mailBody(submitter) + (fileUrl ? `\n\n${fileUrl}` : ""),
    options
  )
}

/**
 * ### Description
 * Returns the "submitter" field from response values and throws error 
 * if it's not found
 *
 * @param {Array} values Array of object with parameters `name` and `value`
 * @return {String} Submitter mail address
 */
function getSubmitter(values) {
  const submitterArray = values.filter(el => el.name === "submitter")
  if (submitterArray.length < 1) {
    throw new Error("Field `submitter` not found in form submission")
  }
  return submitterArray[0].value
}

/**
 * ### Description
 * Generate name for the new file
 *
 * @param {String} submitter Mail of the submitter user
 * @return {String} New file name
 */
function generateFileName(submitter) {
  const fileName = SpreadsheetApp.getActiveSpreadsheet().getName() 
  return `${fileName} ${submitter} - wypełniony szablon`;
}

/**
 * ### Description
 * Error handling function for sending the error stack trace to the MAINTAINER
 *
 * @param {Error} err Thrown error
 */
function errorHandler(err, e) {
  console.error(err)
  MailApp.sendEmail(
    MAINTAINER,
    "ERROR " + MAIL_TITLE,
    `Plik: ${SpreadsheetApp.getActiveSpreadsheet().getName()}
URL: ${SpreadsheetApp.getActiveSpreadsheet().getUrl()}
Formularz: ${JSON.stringify(e.namedValues)}

${err.stack}`
  )
  throw err
}

/**
 * ### Description
 * This function extracts id from Google Drive link
 *
 * @param {String} url Link to file on Google Drive
 * @return {Object} Object containing blob with generated PDF and url to source file
 */
function getIdFromUrl(url) { 
  return url.match(/[-\w]{25,}(?!.*[-\w]{25,})/)[0];
}

/**
 * ### Description
 * This function will check if template file is a valid one and then run pdf generation procedure
 *
 * @param {Object} settings Object containing setting options from SETTINGS_SHEET
 * @param {Array} values Array of object with parameters `name` and `value`
 * @return {Object} Object containing blob with generated PDF and url to source file
 */
async function generatePDF(settings, values) {
  const { templateUrl, folderUrl } = settings
  if (!templateUrl) { throw new Error("templateUrl is not defined") }
  if (!folderUrl) { throw new Error("folderUrl is not defined") }
  const templateFile = DriveApp.getFileById(getIdFromUrl(templateUrl))
  const fileType = templateFile.getMimeType()
  const isDocs = (fileType === "application/vnd.google-apps.document")
  if (isDocs) {
    return await generatePDFFromDocs(
      templateFile, 
      values, 
      DriveApp.getFolderById(getIdFromUrl(folderUrl))
    )
  } else {
    throw new Error("Unrecognized file format")
  }
}

/**
 * ### Description
 * This function will create new document and return PDF blob and url to source file, which will be deleted
 *
 * @param {Drive.File} templateFile Template file to generate PDF from
 * @param {Array} values Array of object with parameters `name` and `value`
 * @param {Drive.Folder} folder Folder where new files will be saved
 * @return {Object} Object containing blob with generated PDF and url to source file
 */
async function generatePDFFromDocs(templateFile, values, folder) {
  const newFile = templateFile.makeCopy(
    generateFileName(getSubmitter(values)), 
    folder
  );
  fillTemplate(newFile, values)
  return {
    pdfBlob: newFile.getAs('application/pdf'),
    googleDocsFileUrl: newFile.getUrl()
  }
}

/**
 * ### Description
 * This function will replace strings like '{{name}}' with corresponding values from `values`
 *
 * @param {Drive.File} newFile New file copied from template, will be overwritten
 * @param {Array} values Array of object with parameters `name` and `value`
 */
function fillTemplate(newFile, values) {
  const newDoc = DocumentApp.openById(newFile.getId())
  const body = newDoc.getBody()
  for (let { name, value } of values) {
    if (value instanceof Date) {
      value = value.toLocaleDateString("pl-PL");
    }
    body.replaceText(`{{${name}}}`, value)
  }
  newDoc.saveAndClose()
}

