// TODO: change this to your email
const MAINTAINER = "patryk.niedzwiedzinski@zhr.pl";

const RESPONSE_SHEET = "form";
const SETTINGS_SHEET = "settings";

const MAIL_TITLE = "[Skryba] Uzupełniony plik";
const mailBody = submitter => `Formularz uzupełniony przez: ${submitter}`;
const fileNaming = fileName => `${fileName} - wypełniony szablon.pdf`;

/**
 * ### Description
 * The main function triggered by form submision
 *
 * @param {Object} e Event information
 */
async function onFormSubmit(e) {
  try {
  const response = getFormResponse(e);
  const submitter = response.filter(el => el.name === "submitter")[0].value

  const settings = getSettings();

  const { pdfBlob, googleDocsFileUrl } = await generatePDF(settings.templateUrl, response);
  sendFile(settings.sendTo, pdfBlob, submitter, googleDocsFileUrl);
  } catch(err) {
    errorHandler(err)
  }
}

/**
 * ### Description
 * This function will parse the form submission based on the headers in Google Sheet
 *
 * @param {Object} e Event information
 * @return {Array} Array of object with parameters `name` and `value`
 */
function getFormResponse(e) {
  const row = e.range.getRow();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(RESPONSE_SHEET);
  const [ headers ] = sheet.getDataRange().getDisplayValues()
  return headers.map((label, idx) => ({ 
    name: label, 
    value: sheet.getRange(row, idx+1).getValue()
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
 * This function will send the PDF blob file
 *
 * @param {String} sendTo Email address
 * @param {Object} blob PDF blob object
 * @param {String} submitter Email address of form submitter
 * @param {String} fileUrl Optional fileUrl to append to mail body
 */
function sendFile(sendTo, blob, submitter, fileUrl=undefined) {
  const fileName = SpreadsheetApp.getActiveSpreadsheet().getName() 
  const options = {
    attachments : {
      'fileName' : fileNaming(`${fileName} ${submitter}`),
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
 * Error handling function for sending the error stack trace to the MAINTAINER
 *
 * @param {Error} err Thrown error
 */
function errorHandler(err) {
  console.error(err)
  MailApp.sendEmail(
    MAINTAINER,
    "ERROR " + MAIL_TITLE,
    `${err.stack}`
  )
  throw err
}

