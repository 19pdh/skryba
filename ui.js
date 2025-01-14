/**
 * The main function triggered when sheet is open, registering the menu option
 *
 * @param {Object} e Event information
 */
function onOpen(e) {
  SpreadsheetApp.getUi()
      .createAddonMenu()
      .addItem('Uwierzytelnij arkusz', 'registerTrigger')
      .addToUi();
}

/**
 * Function to be called from Sheets menu, run user authorization
 * and register new trigger on form submission
 *
 */
function registerTrigger() {
 ScriptApp.newTrigger("onFormSubmit")
   .forSpreadsheet(SpreadsheetApp.getActive())
   .onFormSubmit()
   .create();
}
