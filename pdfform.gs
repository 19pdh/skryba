/**
 * ### Description
 * This is a Class object for retrieving and putting values for the PDF form using Google Apps Script.
 *
 * Author: Tanaike ( https://tanaikech.github.io/ )
 */
class PdfForm {
  /**
   * ### Description
   * Constructor of this class.
   *
   * @return {void}
   */
  constructor(obj = {}) {
    this.cdnjs = "https://cdn.jsdelivr.net/npm/pdf-lib/dist/pdf-lib.min.js"; // or "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js"
    this.loadPdfLib_();
    this.standardFont = null;
    this.customFont = null;

    if (obj.standardFont && typeof obj.standardFont == "string") {
      this.standardFont = obj.standardFont;
    } else if (obj.customFont && obj.customFont.toString() == "Blob") {
      this.customFont = obj.customFont;
      this.cdnFontkit = "https://unpkg.com/@pdf-lib/fontkit/dist/fontkit.umd.min.js";
      this.loadFontkit_();
    }
  }

  /**
   * ### Description
   * Get values from each field of PDF form using pdf-lib.
   *
   * @param {Object} blob Blob of PDF data by retrieving with Google Apps Script.
   * @return {Object} Object including the values of PDF form.
   */
  getValues(blob) {
    return new Promise(async (resolve, reject) => {
      try {
        const pdfDoc = await this.getPdfDocFromBlob_(blob).catch(err => reject(err));
        const form = pdfDoc.getForm();
        const { PDFTextField, PDFDropdown, PDFCheckBox, PDFRadioGroup } = this.PDFLib;
        const obj = form.getFields().map(function (f) {
          const retObj = { name: f.getName() };
          if (f instanceof PDFTextField) {
            retObj.value = f.getText();
            retObj.type = "Textbox";
          } else if (f instanceof PDFDropdown) {
            retObj.value = f.getSelected();
            retObj.options = f.getOptions();
            retObj.type = "Dropdown";
          } else if (f instanceof PDFCheckBox) {
            retObj.value = f.isChecked();
            retObj.type = "Checkbox";
          } else if (f instanceof PDFRadioGroup) {
            retObj.value = f.getSelected();
            retObj.options = f.getOptions();
            retObj.type = "Radiobutton";
          } else {
            retObj.type = "Unsupported type";
          }
          return retObj;
        });
        resolve(obj);
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * ### Description
   * Put values to each field of PDF Forms using pdf-lib.
   *
   * @param {Object} blob Blob of PDF data by retrieving with Google Apps Script.
   * @param {Object} object An array object including the values to PDF forms.
   * @return {Object} Blob of updated PDF data.
   */
  setValues(blob, object) {
    return new Promise(async (resolve, reject) => {
      try {
        const pdfDoc = await this.getPdfDocFromBlob_(blob).catch(err => reject(err));
        const form = pdfDoc.getForm();
        if (this.standardFont || this.customFont) {
          await this.setCustomFont_(pdfDoc, form);
        }
        const { PDFTextField, PDFDropdown, PDFCheckBox, PDFRadioGroup } = this.PDFLib;
        for (let { name, value } of object) {
          const field = form.getField(name);
          if (field instanceof PDFTextField) {
            field.setText(value);
          } else if (field instanceof PDFDropdown) {
            if (field.isMultiselect()) {
              for (let v of value) {
                field.select(v);
              }
            } else {
              field.select(value);
            }
          } else if (field instanceof PDFCheckBox) {
            field[value ? "check" : "uncheck"]();
          } else if (field instanceof PDFRadioGroup) {
            field.select(value);
          }
        }
        form.flatten();
        const bytes = await pdfDoc.save();
        const [filename, extension] = blob.getName().split(".");
        const newBlob = Utilities.newBlob([...new Int8Array(bytes)], MimeType.PDF, `${filename}_updated${extension ? ("." + extension) : ""}`);
        resolve(newBlob);
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * ### Description
   * Load pdf-lib. https://pdf-lib.js.org/docs/api/classes/pdfdocument
   *
   * @return {void}
   */
  loadPdfLib_() {
    eval(UrlFetchApp.fetch(this.cdnjs).getContentText().replace(/setTimeout\(.*?,.*?(\d*?)\)/g, "Utilities.sleep($1);return t();"));
  }

  /**
   * ### Description
   * Load fontkit. https://github.com/Hopding/fontkit
   *
   * @return {void}
   */
  loadFontkit_() {
    eval(UrlFetchApp.fetch(this.cdnFontkit).getContentText());
  }

  /**
   * ### Description
   * Get PDF document object using pdf-lib.
   *
   * @param {Object} blob Blob of PDF data by retrieving with Google Apps Script.
   * @return {Object} PDF document object using pdf-lib.
   */
  async getPdfDocFromBlob_(blob) {
    if (blob.toString() != "Blob") {
      throw new error("Please set PDF blob.");
    }
    return await this.PDFLib.PDFDocument.load(new Uint8Array(blob.getBytes()), { updateMetadata: true });
  }

  /**
   * ### Description
   * Set custom font to PDF form.
   *
   * @param {Object} pdfDoc Object of PDF document.
   * @param {Object} form Object of PDF form.
   * @return {void}
   */
  async setCustomFont_(pdfDoc, form) {
    let customfont;
    if (this.standardFont) {
      customfont = await pdfDoc.embedFont(this.PDFLib.StandardFonts[this.standardFont]);
    } else if (this.customFont) {
      pdfDoc.registerFontkit(this.fontkit);
      customfont = await pdfDoc.embedFont(new Uint8Array(this.customFont.getBytes()));
    }

    // Ref: https://github.com/Hopding/pdf-lib/issues/1152
    const rawUpdateFieldAppearances = form.updateFieldAppearances.bind(form);
    form.updateFieldAppearances = function () {
      return rawUpdateFieldAppearances(customfont);
    };

  }
}
