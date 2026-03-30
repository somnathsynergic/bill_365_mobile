import { BluetoothEscposPrinter } from "react-native-bluetooth-escpos-printer"
import { fileStorage, loginStorage } from "../../storage/appStorage"
import { useContext } from "react"
import {
  ImageLibraryOptions,
  ImagePickerResponse,
  launchImageLibrary,
} from "react-native-image-picker"
import { AppStore } from "../../context/AppContext"
import {
  CalculatorShowBillData,
  CancelledBillsReportData,
  CancelledBillsReportResponse,
  CollectionReport,
  CreditReportResponseData,
  CustomerLedgerData,
  DaybookReportData,
  DueReportData,
  GstStatement,
  GstSummary,
  ItemReportData,
  ItemsData,
  RecoveryAmountResponseData,
  RecoveryReportData,
  RefundReportData,
  SaleReport,
  SaleReportCalculateModeData,
  ShowBillData,
  StockReportResponse,
  UserwiseReportData,
} from "../../models/api_types"
import { gstFilterationAndTotals } from "../../utils/gstFilterTotal"
import { gstFilterationAndTotalForRePrint } from "../../utils/gstFilterTotalForRePrint"
import useCalculations from "../useCalculations"
import usePrintCalculations from "../usePrintCalculations"
import { AppStoreContext, Bill } from "../../models/custom_types"
import { BASE_URL_CATEGORY_IMG } from "../../config/config"

export const useBluetoothPrint = () => {
  const { receiptSettings } = useContext<AppStoreContext>(AppStore)
  const {
    netTotalWithGSTCalculate,
    roundingOffWithGSTCalculate,
    grandTotalWithGSTCalculate,
    roundingOffCalculate,
    grandTotalCalculate,
    netTotalCalculate,

    totalAmountWithGSTInclCalculate,
    netTotalWithGSTInclCalculate,
    roundingOffWithGSTInclCalculate,
    grandTotalWithGSTInclCalculate,
  } = useCalculations()

  const {
    calculatePercentDiscountPerProduct,
    calculateAmountAfterPercentDiscountPerProduct,
    calculateAmountDiscountPerProduct,
    calculateAmountAfterAmountDiscountPerProduct,
  } = usePrintCalculations()

  const selectLogo = () => {
    const options: ImageLibraryOptions = {
      mediaType: "photo",
      includeBase64: true,
    }

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        console.log("User cancelled image picker")
        fileStorage.clearAll()
      } else if (response.errorCode) {
        console.log("ImagePicker Error: ", response.errorMessage)
        fileStorage.clearAll()
      } else {
        const fileStore = fileStorage.getString("file-data")
        const fileStoreUri = fileStorage.getString("file-uri")

        if (fileStore?.length || fileStoreUri?.length > 0) {
          fileStorage.clearAll()
        }

        const source = response?.assets[0]?.base64
        const srcUri = response?.assets[0]?.uri
        // const fileSize = response?.assets[0]?.fileSize

        // setImgSrcUri(srcUri)

        fileStorage.set("comp_picture", source?.toString())
        // fileStorage.set("file-uri", srcUri?.toString())

        // console.log("ashdguasydguasdguyasdasd", fileStore)
        // console.log("ashdguasydguasdgufddstgdtgrgdfgdfgdffyasdasd", imgSrcUri)
        console.log(
          "ashdguasydguasdgufddstgdtgrgdfgdfgdffyasdasd",
          source?.toString(),
        )
      }
    })
  }

  function getPrinterConfig(printOp: string | number) {
    const op = printOp?.toString();

    if (op === "3") {
      // 3-inch widths (example — adjust if desired)
      return {
        picOptions: { width: 320, left: 10 },
        columnWidthsHeader: [10, 2, 26],
        columnWidthsProductsHeaderAndBody: [12, 5, 8, 7, 10],
        columnWidthsProductsHeaderAndBodyWithoutDiscount: [10, 8, 10, 12],
        columnWidthsItemTotal: [26, 16],
        columnWidths: [14, 2, 22],
        columnWidthIfNameIsBig: [40],
      };
    }

    // Default == 2-inch
    return {
      picOptions: { width: 210, left: 50 },
      columnWidthsHeader: [8, 1, 21],
      columnWidthsProductsHeaderAndBody: [8, 4, 6, 5, 7],
      columnWidthsProductsHeaderAndBodyWithoutDiscount: [8, 6, 7, 8],
      columnWidthsItemTotal: [18, 12],
      columnWidths: [11, 1, 18],
      columnWidthIfNameIsBig: [32],
    };
  }



  //  async function printReceiptprintop(
  async function printReceipt(
    addedProducts: ItemsData[],
    netTotal: number,
    totalDiscountAmount: number,
    cashAmount?: number,
    returnedAmt?: number,
    customerName?: string,
    customerPhone?: string,
    rcptNo?: number,
    paymentMode?: string,
    kotNo?: number,
    tableNo?: number,
  ) {
    const loginStore = JSON.parse(loginStorage.getString("login-data"))
    const fileStore = fileStorage.getString("comp_picture")
    const upiStore = fileStorage.getString("upi-blob")
    const upiData = fileStorage.getString("upi-data")

    const shopName: string = loginStore?.company_name?.toString()
    const address: string = loginStore?.address?.toString()
    const location: string = loginStore?.branch_name?.toString()
    const shopMobile: string = loginStore?.phone_no?.toString()
    const shopEmail: string = loginStore?.email_id?.toString()
    const cashier: string = loginStore?.user_name?.toString()
    console.log('printreceipt')
    function wrapText(text: string, maxLen: number) {
      const lines: string[] = [];
      let current = text;

      while (current.length > maxLen) {
        // find space to break on
        let idx = current.lastIndexOf(" ", maxLen);
        if (idx <= 0) idx = maxLen; // hard break if no space
        lines.push(current.slice(0, idx));
        current = current.slice(idx).trim();
      }

      if (current.length > 0) {
        lines.push(current);
      }

      return lines;
    }
    let gstTotals = gstFilterationAndTotals(
      addedProducts,
      receiptSettings?.gst_type,
    )
    let { totalGST } = gstTotals // Destructure totalGST for separate handling

    const gstKeys = Object.keys(gstTotals).filter(
      key => key.includes("totalCGST") || key.includes("totalSGST"),
    )

    let totalQuantities: number = 0
    let totalAmountAfterDiscount: number = 0

    try {
      if (receiptSettings?.print_op === "3") {
        let columnWidths = [20, 1, 27]
        let columnWidthsHeader = [15, 1, 32]
        let columnWidthsProductsHeaderAndBody = [18, 4, 8, 8, 10]
        let columnWidthsProductsHeaderAndBodyWithoutDiscount = [24, 6, 9, 9]
        let columnWidthsItemTotal = [30, 18]
        let columnWidthIfNameIsBig = [48]
        let columnWidthForKot = [15, 33]
        const separator = "------------------------------------------------"

        if (receiptSettings?.kot_flag === "Y") {
          if (tableNo) {
            await BluetoothEscposPrinter.printerAlign(
              BluetoothEscposPrinter.ALIGN.CENTER,
            )

            await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
              align: "center",
              widthtimes: 1.2,
              heigthtimes: 2,
            })

            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printerAlign(
              BluetoothEscposPrinter.ALIGN.CENTER,
            )

            await BluetoothEscposPrinter.printText(separator, {})
            await BluetoothEscposPrinter.printText("\n", {})

            await BluetoothEscposPrinter.printColumn(
              columnWidthForKot,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              ["KOT NO.", `${kotNo}`],
              {},
            )

            await BluetoothEscposPrinter.printColumn(
              columnWidthForKot,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              ["TABLE NO.", `${tableNo || 0}`],
              {},
            )

            await BluetoothEscposPrinter.printColumn(
              columnWidthForKot,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              ["DT.", `${new Date().toLocaleString("en-GB")}`],
              {},
            )

            await BluetoothEscposPrinter.printerAlign(
              BluetoothEscposPrinter.ALIGN.CENTER,
            )

            await BluetoothEscposPrinter.printText(separator, {})
            await BluetoothEscposPrinter.printText("\n", {})

            await BluetoothEscposPrinter.printColumn(
              columnWidthForKot,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              ["ITEM", `QTY`],
              {},
            )

            for (const item of addedProducts) {
              if (item?.item_name?.length > 10) {
                // const wrappedItemName = wrapText(item.item_name, 15)
                // for (const line of wrappedItemName) {
                //   await BluetoothEscposPrinter.printColumn(
                //     columnWidthIfNameIsBig,
                //     [BluetoothEscposPrinter.ALIGN.LEFT],
                //     [line],
                //     {},
                //   )
                // }
                await BluetoothEscposPrinter.printColumn(
                  columnWidthIfNameIsBig,
                  [
                    BluetoothEscposPrinter.ALIGN.LEFT,
                  ],
                  [`${item?.item_name}`],
                  {},
                )
                await BluetoothEscposPrinter.printColumn(
                  columnWidthIfNameIsBig,
                  [BluetoothEscposPrinter.ALIGN.RIGHT],
                  [`${item?.quantity}`],
                  {},
                )
              } else {
                await BluetoothEscposPrinter.printColumn(
                  columnWidthForKot,
                  [
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                  ],
                  [`${item?.item_name}`, `${item?.quantity}`],
                  {},
                )
              }
            }

            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printerAlign(
              BluetoothEscposPrinter.ALIGN.CENTER,
            )

            await BluetoothEscposPrinter.printText(separator, {})
            await BluetoothEscposPrinter.printText("\n\n\n", {})
          }
        }

        if (fileStore?.length > 0) {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          const options = {
            width: 375, // Assuming 80mm paper
            left: 50,
          }
          const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
            ? fileStore.split("data:application/octet-stream;base64,")[1]

            : fileStore
          console.log(pureBase64, 'purbase64 er indicator dao reprint!')
          if (receiptSettings?.logo_flag == 'Y')
            await BluetoothEscposPrinter.printPic(pureBase64, options)
          // await BluetoothEscposPrinter.printPic(fileStore, options)
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
          align: "center",
          widthtimes: 1.2,
          heigthtimes: 2,
        })
        await BluetoothEscposPrinter.printText("\n", {})

        if (receiptSettings?.on_off_flag1 === "Y") {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText(receiptSettings?.header1, {
            align: "center",
          })
          await BluetoothEscposPrinter.printText("\n", {})
        }

        if (receiptSettings?.on_off_flag2 === "Y") {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText(receiptSettings?.header2, {
            align: "center",
          })
        }
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText("RECEIPT", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText(separator, {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeader,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["RCPT.NO", ":", rcptNo?.toString()],
          {},
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeader,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["DATE", ":", `${new Date().toLocaleString("en-GB")}`],
          {},
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeader,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["CASHIER", ":", cashier],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText(separator, {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})

        if (customerName.length !== 0 || customerPhone.length !== 0) {
          receiptSettings?.cust_inf === "Y" &&
            (await BluetoothEscposPrinter.printColumn(
              columnWidthsHeader,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.CENTER,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              ["NAME", ":", customerName],
              {},
            ))
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText(separator, {
            align: "center",
          })
          await BluetoothEscposPrinter.printText("\n", {})
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        receiptSettings?.discount_flag === "Y" &&
          receiptSettings?.discount_position !== "B"
          ? await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ["ITEM", "QTY", "MRP", "DIS.", "TOT AMT"],
            {},
          )
          : await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBodyWithoutDiscount,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ["ITEM", "QTY", "MRP", "TOT AMT"],
            {},
          )
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText(separator, {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        for (const item of addedProducts) {
          //@ts-ignore
          totalQuantities += parseInt(item?.quantity)

          const maxLen =
            receiptSettings?.discount_flag === "Y" &&
              receiptSettings?.discount_position !== "B"
              ? 18
              : 24
          const nameLines = wrapText(item.item_name, maxLen)
          const firstLine = nameLines.shift() || ""

          if (
            receiptSettings?.discount_flag === "Y" &&
            receiptSettings?.discount_position !== "B"
          ) {
            if (receiptSettings?.discount_type === "P") {
              await BluetoothEscposPrinter.printColumn(
                columnWidthsProductsHeaderAndBody,
                [
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.CENTER,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                ],
                //@ts-ignore
                [
                  firstLine,
                  item?.quantity.toString(),
                  item?.price.toString(),
                  calculatePercentDiscountPerProduct(
                    item?.price,
                    item?.quantity,
                    item?.discount,
                  ),
                  calculateAmountAfterPercentDiscountPerProduct(
                    item?.price,
                    item?.quantity,
                    item?.discount,
                  ),
                ],
                {},
              )
            } else {
              await BluetoothEscposPrinter.printColumn(
                columnWidthsProductsHeaderAndBody,
                [
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.CENTER,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                ],
                //@ts-ignore
                [
                  firstLine,
                  item?.quantity.toString(),
                  item?.price.toString(),
                  calculateAmountDiscountPerProduct(
                    item?.quantity,
                    item?.discount,
                  ),
                  calculateAmountAfterAmountDiscountPerProduct(
                    item?.price,
                    item?.quantity,
                    item?.discount,
                  ),
                ],
                {},
              )
            }
          } else {
            await BluetoothEscposPrinter.printColumn(
              columnWidthsProductsHeaderAndBodyWithoutDiscount,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              //@ts-ignore
              [
                firstLine,
                item?.quantity.toString(),
                item?.price.toString(),
                calculateAmountAfterAmountDiscountPerProduct(
                  item?.price,
                  item?.quantity,
                  0,
                ),
              ],
              {},
            )
          }

          for (const line of nameLines) {
            await BluetoothEscposPrinter.printColumn(
              columnWidthIfNameIsBig,
              [BluetoothEscposPrinter.ALIGN.LEFT],
              [line],
              {},
            )
          }
        }
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText(separator, {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printColumn(
          columnWidthsItemTotal,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            `ITEM: ${addedProducts?.length?.toString()} QTY: ${totalQuantities.toString()}`,
            `AMT: ${netTotal?.toFixed(2)}`,
          ],
          {},
        )

        gstKeys.map(
          async key =>
            await BluetoothEscposPrinter.printColumn(
              columnWidths,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.CENTER,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              [
                `${key.includes("CGST") ? "CGST" : "SGST"} @${key
                  .replace(/total(CGST|SGST)_/, "")
                  .replace("_", ".")}%`,
                ":",
                gstTotals[key].toFixed(2),
              ],
              {},
            ),
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["TOTAL GST", ":", totalGST.toFixed(2).toString()],
          {},
        )

        receiptSettings?.discount_flag === "Y" &&
          (await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            //@ts-ignore
            ["DISCOUNT", ":", parseFloat(totalDiscountAmount).toFixed(2)],
            {},
          ))

        receiptSettings?.gst_type === "E"
          ? await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              "TOTAL",
              ":",
              `${netTotalWithGSTCalculate(
                netTotal,
                totalDiscountAmount,
                totalGST,
              )}`,
            ],
            {},
          )
          : await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              "TOTAL",
              ":",
              `${netTotalWithGSTInclCalculate(netTotal, totalDiscountAmount)}`,
            ],
            {},
          )

        receiptSettings?.gst_type === "E"
          ? await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              "ROUND OFF",
              ":",
              `${roundingOffWithGSTCalculate(
                netTotal,
                totalDiscountAmount,
                totalGST,
              )}`,
            ],
            {},
          )
          : await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              "ROUND OFF",
              ":",
              `${roundingOffWithGSTInclCalculate(
                netTotal,
                totalDiscountAmount,
              )}`,
            ],
            {},
          )

        receiptSettings?.gst_type === "E"
          ? await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              "NET AMT",
              ":",
              `${grandTotalWithGSTCalculate(
                netTotal,
                totalDiscountAmount,
                totalGST,
              )}`,
            ],
            {},
          )
          : await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              "NET AMT",
              ":",
              `${grandTotalWithGSTInclCalculate(
                netTotal,
                totalDiscountAmount,
              )}`,
            ],
            {},
          )

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText(separator, {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})
        if (receiptSettings?.rcv_cash_flag === "Y") {
          if (paymentMode === "C") {
            await BluetoothEscposPrinter.printText("PAYMENT MODE", {
              align: "center",
            })
            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printText(
              `CASH RECEIVED:       ${cashAmount}`,
              { align: "center" },
            )
            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printText(
              `RETURNED AMT:        ${returnedAmt}`,
              { align: "center" },
            )

            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printerAlign(
              BluetoothEscposPrinter.ALIGN.CENTER,
            )

            await BluetoothEscposPrinter.printText(separator, {
              align: "center",
            })
            await BluetoothEscposPrinter.printText("\n", {})
          }
        } else {
          await BluetoothEscposPrinter.printText(
            `TOTAL RETURNED AMT:        ${Math.abs(returnedAmt)}`,
            { align: "center" },
          )

          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText(separator, {
            align: "center",
          })
          await BluetoothEscposPrinter.printText("\n", {})
        }
        if (paymentMode === "R") {
          await BluetoothEscposPrinter.printText("PAYMENT MODE", {
            align: "center",
          })
          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printText(
            `CASH RECEIVED:       ${cashAmount}`,
            { align: "center" },
          )
          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printText(
            `DUE AMT:        ${Math.abs(returnedAmt)}`,
            { align: "center" },
          )

          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText(separator, {
            align: "center",
          })
          await BluetoothEscposPrinter.printText("\n", {})
        }
        if (paymentMode === "D") {
          receiptSettings?.gst_type === "E"
            ? await BluetoothEscposPrinter.printText(
              `RECEIVED:       ${grandTotalWithGSTCalculate(
                netTotal,
                totalDiscountAmount,
                totalGST,
              )} [CARD]`,
              { align: "center" },
            )
            : await BluetoothEscposPrinter.printText(
              `RECEIVED:       ${grandTotalWithGSTInclCalculate(
                netTotal,
                totalDiscountAmount,
              )} [CARD]`,
              { align: "center" },
            )
          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText(separator, {
            align: "center",
          })
          await BluetoothEscposPrinter.printText("\n", {})
        }
        if (paymentMode === "U") {
          receiptSettings?.gst_type === "E"
            ? await BluetoothEscposPrinter.printText(
              `RECEIVED:       ${grandTotalWithGSTCalculate(
                netTotal,
                totalDiscountAmount,
                totalGST,
              )} [UPI]`,
              { align: "center" },
            )
            : await BluetoothEscposPrinter.printText(
              `RECEIVED:       ${grandTotalWithGSTInclCalculate(
                netTotal,
                totalDiscountAmount,
              )} [UPI]`,
              { align: "center" },
            )
          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printText(separator, {
            align: "center",
          })

          if (upiData?.length > 0) {
            BluetoothEscposPrinter.printQRCode(
              `${upiData}&am=${receiptSettings?.gst_type === "E"
                ? grandTotalWithGSTCalculate(
                  netTotal,
                  totalDiscountAmount,
                  totalGST,
                )
                : grandTotalWithGSTInclCalculate(netTotal, totalDiscountAmount)
              }`,
              380, // Adjusted for 3-inch
              BluetoothEscposPrinter.ERROR_CORRECTION.L,
            )
          }
          await BluetoothEscposPrinter.printText("\n", {})
        }

        if (receiptSettings?.on_off_flag3 === "Y") {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
          await BluetoothEscposPrinter.printText("\n", {})
        }
        if (receiptSettings?.on_off_flag4 === "Y") {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
        }
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText("------X------", {
          textAlign: "center",
        })
        await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
      } else {
        let columnWidths = [11, 1, 18]
        let columnWidthsHeader = [8, 1, 21]
        let columnWidthsProductsHeaderAndBody = [8, 4, 6, 5, 7]
        let columnWidthsProductsHeaderAndBodyWithoutDiscount = [8, 6, 7, 8]
        // let columnWidthsProductsHeaderAndBody = [18, 3, 4, 3, 4]
        let columnWidthsItemTotal = [18, 12]
        let columnWidthIfNameIsBig = [32]
        let columnWidthForKot = [10, 22]

        if (receiptSettings?.kot_flag === "Y") {
          if (tableNo) {
            await BluetoothEscposPrinter.printerAlign(
              BluetoothEscposPrinter.ALIGN.CENTER,
            )

            await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
              align: "center",
              widthtimes: 1.2,
              heigthtimes: 2,
            })

            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printerAlign(
              BluetoothEscposPrinter.ALIGN.CENTER,
            )

            await BluetoothEscposPrinter.printText(
              "-------------------------",
              {},
            )
            await BluetoothEscposPrinter.printText("\n", {})

            await BluetoothEscposPrinter.printColumn(
              columnWidthForKot,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              ["KOT NO.", `${kotNo}`],
              {},
            )

            await BluetoothEscposPrinter.printColumn(
              columnWidthForKot,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              ["TABLE NO.", `${tableNo || 0}`],
              {},
            )

            await BluetoothEscposPrinter.printColumn(
              columnWidthForKot,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              ["DT.", `${new Date().toLocaleString("en-GB")}`],
              {},
            )

            // await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printerAlign(
              BluetoothEscposPrinter.ALIGN.CENTER,
            )

            await BluetoothEscposPrinter.printText(
              "-------------------------",
              {},
            )
            await BluetoothEscposPrinter.printText("\n", {})

            await BluetoothEscposPrinter.printColumn(
              columnWidthForKot,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              ["ITEM", `QTY`],
              {},
            )

            for (const item of addedProducts) {
              if (item?.item_name?.length > 10) {
                await BluetoothEscposPrinter.printColumn(
                  columnWidthIfNameIsBig,
                  [BluetoothEscposPrinter.ALIGN.LEFT],
                  [item.item_name],
                  {},
                )
                await BluetoothEscposPrinter.printColumn(
                  columnWidthIfNameIsBig,
                  [BluetoothEscposPrinter.ALIGN.RIGHT],
                  [`${item?.quantity}`],
                  {},
                )
              } else {
                await BluetoothEscposPrinter.printColumn(
                  columnWidthForKot,
                  [
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                  ],
                  [`${item?.item_name}`, `${item?.quantity}`],
                  {},
                )
              }
            }

            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printerAlign(
              BluetoothEscposPrinter.ALIGN.CENTER,
            )

            await BluetoothEscposPrinter.printText(
              "-------------------------",
              {},
            )
            await BluetoothEscposPrinter.printText("\n\n\n", {})
          }
        }

        if (fileStore?.length > 0) {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          const options = {
            width: 250, // Assuming 58mm paper width with 8 dots/mm resolution (58mm * 8dots/mm = 384 dots)
            left: 50, // No left padding
            // align: "CENTER"
          }

          // Print the image
          const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
            ? fileStore.split("data:application/octet-stream;base64,")[1]

            : fileStore
          console.log(pureBase64, 'purbase64 er indicator dao reprint!')
          if (receiptSettings?.logo_flag == 'Y')
            await BluetoothEscposPrinter.printPic(pureBase64, options)
          // await BluetoothEscposPrinter.printPic(fileStore, options)
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
          align: "center",
          widthtimes: 1.2,
          heigthtimes: 2,
        })
        await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText("hasifughaf", { align: "center" })

        if (receiptSettings?.on_off_flag1 === "Y") {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText(receiptSettings?.header1, {
            align: "center",
          })
          await BluetoothEscposPrinter.printText("\n", {})
        }

        if (receiptSettings?.on_off_flag2 === "Y") {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText(receiptSettings?.header2, {
            align: "center",
          })
        }
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText("RECEIPT", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeader,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["RCPT.NO", ":", rcptNo?.toString()],
          {},
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeader,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["DATE", ":", `${new Date().toLocaleString("en-GB")}`],
          {},
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeader,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["CASHIER", ":", cashier],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})

        if (customerName.length !== 0 || customerPhone.length !== 0) {
          receiptSettings?.cust_inf === "Y" &&
            (await BluetoothEscposPrinter.printColumn(
              columnWidthsHeader,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.CENTER,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              ["NAME", ":", customerName],
              {},
            ))
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText("------------------------", {
            align: "center",
          })
          await BluetoothEscposPrinter.printText("\n", {})
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        receiptSettings?.discount_flag === "Y" &&
          receiptSettings?.discount_position !== "B"
          ? await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ["ITEM", "QTY", "MRP", "DIS.", "TOT AMT"],
            {},
          )
          : await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBodyWithoutDiscount,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ["ITEM", "QTY", "MRP", "TOT AMT"],
            {},
          )
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        for (const item of addedProducts) {
          //@ts-ignore
          totalQuantities += parseInt(item?.quantity)

          const firstLine = item.item_name;

          if (
            receiptSettings?.discount_flag === "Y" &&
            receiptSettings?.discount_position !== "B"
          ) {
            if (receiptSettings?.discount_type === "P") {
              await BluetoothEscposPrinter.printColumn(
                columnWidthsProductsHeaderAndBody,
                [
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.CENTER,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                ],
                //@ts-ignore
                [
                  firstLine,
                  item?.quantity.toString(),
                  item?.price.toString(),
                  calculatePercentDiscountPerProduct(
                    item?.price,
                    item?.quantity,
                    item?.discount,
                  ),
                  calculateAmountAfterPercentDiscountPerProduct(
                    item?.price,
                    item?.quantity,
                    item?.discount,
                  ),
                ],
                {},
              )
            } else {
              await BluetoothEscposPrinter.printColumn(
                columnWidthsProductsHeaderAndBody,
                [
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.CENTER,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                ],
                //@ts-ignore
                [
                  firstLine,
                  item?.quantity.toString(),
                  item?.price.toString(),
                  calculateAmountDiscountPerProduct(
                    item?.quantity,
                    item?.discount,
                  ),
                  calculateAmountAfterAmountDiscountPerProduct(
                    item?.price,
                    item?.quantity,
                    item?.discount,
                  ),
                ],
                {},
              )
            }
          } else {
            await BluetoothEscposPrinter.printColumn(
              columnWidthsProductsHeaderAndBodyWithoutDiscount,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              //@ts-ignore
              [
                firstLine,
                item?.quantity.toString(),
                item?.price.toString(),
                calculateAmountAfterAmountDiscountPerProduct(
                  item?.price,
                  item?.quantity,
                  0,
                ),
              ],
              {},
            )
          }
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printColumn(
          columnWidthsItemTotal,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            `ITEM: ${addedProducts?.length?.toString()} QTY: ${totalQuantities.toString()}`,
            `AMT: ${netTotal?.toFixed(2)}`,
          ],
          {},
        )

        gstKeys.map(
          async key =>
            await BluetoothEscposPrinter.printColumn(
              columnWidths,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.CENTER,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              [
                `${key.includes("CGST") ? "CGST" : "SGST"} @${key
                  .replace(/total(CGST|SGST)_/, "")
                  .replace("_", ".")}%`,
                ":",
                gstTotals[key].toFixed(2),
              ],
              {},
            ),
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["TOTAL GST", ":", totalGST.toFixed(2).toString()],
          {},
        )

        receiptSettings?.discount_flag === "Y" &&
          (await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            //@ts-ignore
            ["DISCOUNT", ":", parseFloat(totalDiscountAmount).toFixed(2)],
            {},
          ))

        receiptSettings?.gst_type === "E"
          ? await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              "TOTAL",
              ":",
              `${netTotalWithGSTCalculate(
                netTotal,
                totalDiscountAmount,
                totalGST,
              )}`,
            ],
            {},
          )
          : await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              "TOTAL",
              ":",
              `${netTotalWithGSTInclCalculate(
                netTotal,
                totalDiscountAmount,
              )}`,
            ],
            {},
          )
        receiptSettings?.gst_type === "E"
          ? await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              "ROUND OFF",
              ":",
              `${roundingOffWithGSTCalculate(
                netTotal,
                totalDiscountAmount,
                totalGST,
              )}`,
            ],
            {},
          )
          : await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              "ROUND OFF",
              ":",
              `${roundingOffWithGSTInclCalculate(
                netTotal,
                totalDiscountAmount,
              )}`,
            ],
            {},
          )

        receiptSettings?.gst_type === "E"
          ? await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              "NET AMT",
              ":",
              `${grandTotalWithGSTCalculate(
                netTotal,
                totalDiscountAmount,
                totalGST,
              )}`,
            ],
            {},
          )
          : await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              "NET AMT",
              ":",
              `${grandTotalWithGSTInclCalculate(
                netTotal,
                totalDiscountAmount,
              )}`,
            ],
            {},
          )

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})
        if (receiptSettings?.rcv_cash_flag === "Y") {
          if (paymentMode === "C") {
            await BluetoothEscposPrinter.printText("PAYMENT MODE", {
              align: "center",
            })
            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printText(
              `CASH RECEIVED:       ${cashAmount}`,
              { align: "center" },
            )
            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printText(
              `RETURNED AMT:        ${returnedAmt}`,
              { align: "center" },
            )

            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printerAlign(
              BluetoothEscposPrinter.ALIGN.CENTER,
            )

            await BluetoothEscposPrinter.printText("------------------------", {
              align: "center",
            })
            await BluetoothEscposPrinter.printText("\n", {})
          }
        } else {
          await BluetoothEscposPrinter.printText(
            `TOTAL RETURNED AMT:        ${Math.abs(returnedAmt)}`,
            { align: "center" },
          )

          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText("------------------------", {
            align: "center",
          })
          await BluetoothEscposPrinter.printText("\n", {})
        }
        if (paymentMode === "R") {
          await BluetoothEscposPrinter.printText("PAYMENT MODE", {
            align: "center",
          })
          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printText(
            `CASH RECEIVED:       ${cashAmount}`,
            { align: "center" },
          )
          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printText(
            `DUE AMT:        ${Math.abs(returnedAmt)}`,
            { align: "center" },
          )

          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText("------------------------", {
            align: "center",
          })
          await BluetoothEscposPrinter.printText("\n", {})
        }
        if (paymentMode === "D") {
          receiptSettings?.gst_type === "E"
            ? await BluetoothEscposPrinter.printText(
              `RECEIVED:       ${grandTotalWithGSTCalculate(
                netTotal,
                totalDiscountAmount,
                totalGST,
              )} [CARD]`,
              { align: "center" },
            )
            : await BluetoothEscposPrinter.printText(
              `RECEIVED:       ${grandTotalWithGSTInclCalculate(
                netTotal,
                totalDiscountAmount,
              )} [CARD]`,
              { align: "center" },
            )
          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText("------------------------", {
            align: "center",
          })
          await BluetoothEscposPrinter.printText("\n", {})
        }
        if (paymentMode === "U") {
          receiptSettings?.gst_type === "E"
            ? await BluetoothEscposPrinter.printText(
              `RECEIVED:       ${grandTotalWithGSTCalculate(
                netTotal,
                totalDiscountAmount,
                totalGST,
              )} [UPI]`,
              { align: "center" },
            )
            : await BluetoothEscposPrinter.printText(
              `RECEIVED:       ${grandTotalWithGSTInclCalculate(
                netTotal,
                totalDiscountAmount,
              )} [UPI]`,
              { align: "center" },
            )
          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printText("------------------------", {
            align: "center",
          })

          if (upiData?.length > 0) {
            BluetoothEscposPrinter.printQRCode(
              `${upiData}&am=${receiptSettings?.gst_type === "E"
                ? grandTotalWithGSTCalculate(
                  netTotal,
                  totalDiscountAmount,
                  totalGST,
                )
                : grandTotalWithGSTInclCalculate(
                  netTotal,
                  totalDiscountAmount,
                )
              }`,
              250,
              BluetoothEscposPrinter.ERROR_CORRECTION.L,
            )
          }
          await BluetoothEscposPrinter.printText("\n", {})
        }

        if (receiptSettings?.on_off_flag3 === "Y") {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
          await BluetoothEscposPrinter.printText("\n", {})
        }
        if (receiptSettings?.on_off_flag4 === "Y") {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
        }
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText("------X------", {
          textAlign: "center",
        })
        await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
      }
    } catch (e) {
      console.log(e.message || "ERROR")
    }
  }
  async function printReceipt_old(
    addedProducts: ItemsData[],
    netTotal: number,
    totalDiscountAmount: number,
    cashAmount?: number,
    returnedAmt?: number,
    customerName?: string,
    customerPhone?: string,
    rcptNo?: number,
    paymentMode?: string,
    kotNo?: number,
    tableNo?: number,
  ) {
    console.log('PRINT RECEIPT=====', addedProducts, netTotal, totalDiscountAmount, cashAmount, returnedAmt, customerName, customerPhone, rcptNo, paymentMode, kotNo, tableNo)
    const loginStore = JSON.parse(loginStorage.getString("login-data"))
    const fileStore = fileStorage.getString("comp_picture")
    const upiStore = fileStorage.getString("upi-blob")
    const upiData = fileStorage.getString("upi-data")

    const shopName: string = loginStore?.company_name?.toString()
    const address: string = loginStore?.address?.toString()
    const location: string = loginStore?.branch_name?.toString()
    const shopMobile: string = loginStore?.phone_no?.toString()
    const shopEmail: string = loginStore?.email_id?.toString()
    const cashier: string = loginStore?.user_name?.toString()

    // let { totalCGST_5, totalCGST_12, totalCGST_18, totalCGST_28, totalSGST_5, totalSGST_12, totalSGST_18, totalSGST_28, totalGST } = gstFilterationAndTotals(addedProducts)

    let gstTotals = gstFilterationAndTotals(
      addedProducts,
      receiptSettings?.gst_type,
    )
    let { totalGST } = gstTotals // Destructure totalGST for separate handling

    // Filter keys for CGST and SGST display
    const gstKeys = Object.keys(gstTotals).filter(
      key => key.includes("totalCGST") || key.includes("totalSGST"),
    )

    let totalQuantities: number = 0
    let totalAmountAfterDiscount: number = 0

    try {
      let columnWidths = [11, 1, 18]
      let columnWidthsHeader = [8, 1, 21]
      let columnWidthsProductsHeaderAndBody = [8, 4, 6, 5, 7]
      let columnWidthsProductsHeaderAndBodyWithoutDiscount = [8, 6, 7, 8]
      // let columnWidthsProductsHeaderAndBody = [18, 3, 4, 3, 4]
      let columnWidthsItemTotal = [18, 12]
      let columnWidthIfNameIsBig = [32]
      let columnWidthForKot = [10, 22]

      // let newColumnWidths: number[] = [9, 9, 6, 7]







      if (receiptSettings?.kot_flag === "Y") {
        if (tableNo) {
          await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

          await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
            align: "center",
            widthtimes: 1.2,
            heigthtimes: 2,
          })

          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

          await BluetoothEscposPrinter.printText("-------------------------", {})
          await BluetoothEscposPrinter.printText("\n", {})

          await BluetoothEscposPrinter.printColumn(
            columnWidthForKot,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ["KOT NO.", `${kotNo}`],
            {},
          )

          await BluetoothEscposPrinter.printColumn(
            columnWidthForKot,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ["TABLE NO.", `${tableNo || 0}`],
            {},
          )

          await BluetoothEscposPrinter.printColumn(
            columnWidthForKot,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ["DT.", `${new Date().toLocaleString("en-GB")}`],
            {},
          )

          // await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

          await BluetoothEscposPrinter.printText("-------------------------", {})
          await BluetoothEscposPrinter.printText("\n", {})

          await BluetoothEscposPrinter.printColumn(
            columnWidthForKot,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ["ITEM", `QTY`],
            {},
          )

          for (const item of addedProducts) {
            if (item?.item_name?.length > 10) {
              await BluetoothEscposPrinter.printColumn(
                columnWidthIfNameIsBig,
                [
                  BluetoothEscposPrinter.ALIGN.LEFT,
                ],
                [`${item?.item_name}`],
                {},
              )
              await BluetoothEscposPrinter.printColumn(
                columnWidthIfNameIsBig,
                [
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                ],
                [`${item?.quantity}`],
                {},
              )
              // await BluetoothEscposPrinter.printText("\n", {})
              // await BluetoothEscposPrinter.printText(`${item.quantity}`, { align: "right" })
            } else {
              await BluetoothEscposPrinter.printColumn(
                columnWidthForKot,
                [
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                ],
                [`${item?.item_name}`, `${item?.quantity}`],
                {},
              )
            }
          }

          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

          await BluetoothEscposPrinter.printText("-------------------------", {})
          await BluetoothEscposPrinter.printText("\n\n\n", {})
        }
      }








      if (fileStore?.length > 0) {
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        const options = {
          width: 250, // Assuming 58mm paper width with 8 dots/mm resolution (58mm * 8dots/mm = 384 dots)
          left: 50, // No left padding
          // align: "CENTER"
        }

        // Print the image
        const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
          ? fileStore.split("data:application/octet-stream;base64,")[1]

          : fileStore
        console.log(pureBase64, 'purbase64 er indicator dao reprint!')
        if (receiptSettings?.logo_flag == 'Y')
          await BluetoothEscposPrinter.printPic(pureBase64, options)
        // await BluetoothEscposPrinter.printPic(fileStore, options)
      }

      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.CENTER,
      )
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
        align: "center",
        widthtimes: 1.2,
        heigthtimes: 2,
      })
      await BluetoothEscposPrinter.printText("\n", {})
      // await BluetoothEscposPrinter.printText("hasifughaf", { align: "center" })

      if (receiptSettings?.on_off_flag1 === "Y") {
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(receiptSettings?.header1, { align: "center", })
        await BluetoothEscposPrinter.printText("\n", {})
      }

      if (receiptSettings?.on_off_flag2 === "Y") {
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(receiptSettings?.header2, { align: "center", })
      }
      await BluetoothEscposPrinter.printText("\n", {})

      await BluetoothEscposPrinter.printText("RECEIPT", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})

      // await BluetoothEscposPrinter.printText("------------------------", {
      //   align: "center",
      // })

      // await BluetoothEscposPrinter.printText("\n", {})
      // await BluetoothEscposPrinter.printText(address, {
      //   align: "center",
      // })
      // await BluetoothEscposPrinter.printText("\n", {})
      // await BluetoothEscposPrinter.printText(location, {
      //   align: "center",
      // })
      // await BluetoothEscposPrinter.printText("\n", {})
      // await BluetoothEscposPrinter.printText("------------------------", {
      //   align: "center",
      // })
      // await BluetoothEscposPrinter.printText("\n", {})

      // // await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT)

      // await BluetoothEscposPrinter.printColumn(
      //   columnWidthsHeader,
      //   [
      //     BluetoothEscposPrinter.ALIGN.LEFT,
      //     BluetoothEscposPrinter.ALIGN.CENTER,
      //     BluetoothEscposPrinter.ALIGN.RIGHT,
      //   ],
      //   ["MOBILE", ":", shopMobile],
      //   {},
      // )
      // await BluetoothEscposPrinter.printColumn(
      //   columnWidthsHeader,
      //   [
      //     BluetoothEscposPrinter.ALIGN.LEFT,
      //     BluetoothEscposPrinter.ALIGN.CENTER,
      //     BluetoothEscposPrinter.ALIGN.RIGHT,
      //   ],
      //   ["EMAIL", ":", shopEmail],
      //   {},
      // )
      // await BluetoothEscposPrinter.printColumn(
      //     columnWidthsHeader,
      //     [
      //         BluetoothEscposPrinter.ALIGN.LEFT,
      //         BluetoothEscposPrinter.ALIGN.CENTER,
      //         BluetoothEscposPrinter.ALIGN.RIGHT,
      //     ],
      //     ["SITE", ":", "SHOPNAME.COM"],
      //     {},
      // )
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })
      await BluetoothEscposPrinter.printText("\n", {})

      await BluetoothEscposPrinter.printColumn(
        columnWidthsHeader,
        [
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.CENTER,
          BluetoothEscposPrinter.ALIGN.RIGHT,
        ],
        ["RCPT.NO", ":", rcptNo?.toString()],
        {},
      )
      await BluetoothEscposPrinter.printColumn(
        columnWidthsHeader,
        [
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.CENTER,
          BluetoothEscposPrinter.ALIGN.RIGHT,
        ],
        ["DATE", ":", `${new Date().toLocaleString("en-GB")}`],
        {},
      )
      await BluetoothEscposPrinter.printColumn(
        columnWidthsHeader,
        [
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.CENTER,
          BluetoothEscposPrinter.ALIGN.RIGHT,
        ],
        ["CASHIER", ":", cashier],
        {},
      )
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })
      await BluetoothEscposPrinter.printText("\n", {})

      if (customerName.length !== 0 || customerPhone.length !== 0) {
        receiptSettings?.cust_inf === "Y" &&
          (await BluetoothEscposPrinter.printColumn(
            columnWidthsHeader,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ["NAME", ":", customerName],
            {},
          ))
        // await BluetoothEscposPrinter.printColumn(
        //   columnWidthsHeader,
        //   [
        //     BluetoothEscposPrinter.ALIGN.LEFT,
        //     BluetoothEscposPrinter.ALIGN.CENTER,
        //     BluetoothEscposPrinter.ALIGN.RIGHT,
        //   ],
        //   ["PHONE", ":", customerPhone],
        //   {},
        // )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})
      }



      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.CENTER,
      )

      receiptSettings?.discount_flag === "Y" &&
        receiptSettings?.discount_position !== "B"
        ? await BluetoothEscposPrinter.printColumn(
          columnWidthsProductsHeaderAndBody,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["ITEM", "QTY", "MRP", "DIS.", "TOT AMT"],
          {},
        )
        : await BluetoothEscposPrinter.printColumn(
          columnWidthsProductsHeaderAndBodyWithoutDiscount,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["ITEM", "QTY", "MRP", "TOT AMT"],
          {},
        )
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})

      for (const item of addedProducts) {
        //@ts-ignore
        totalQuantities += parseInt(item?.quantity)
        // receiptSettings?.discount_type === "P" && receiptSettings?.discount_position !== "B"
        //     ? totalAmountAfterDiscount += ((item?.price * item?.quantity) - ((item?.price * item?.quantity * item?.discount) / 100))
        //     : totalAmountAfterDiscount += ((item?.price * item?.quantity) - (item?.quantity * item?.discount))

        if (item?.item_name?.length >= 8) {
          await BluetoothEscposPrinter.printColumn(
            columnWidthIfNameIsBig,
            [BluetoothEscposPrinter.ALIGN.LEFT],
            [item?.item_name],
            {},
          )

          receiptSettings?.discount_flag === "Y" &&
            receiptSettings?.discount_position !== "B"
            ? receiptSettings?.discount_type === "P"
              ? await BluetoothEscposPrinter.printColumn(
                columnWidthsProductsHeaderAndBody,
                [
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.CENTER,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                ],
                //@ts-ignore
                [
                  "",
                  item?.quantity.toString(),
                  item?.price.toString(),
                  calculatePercentDiscountPerProduct(
                    item?.price,
                    item?.quantity,
                    item?.discount,
                  ),
                  calculateAmountAfterPercentDiscountPerProduct(
                    item?.price,
                    item?.quantity,
                    item?.discount,
                  ),
                ],
                // ["", item?.quantity.toString(), item?.price.toString(), parseFloat((parseFloat(item?.price) * parseFloat(item?.quantity) * parseFloat(item?.discount)) / 100).toFixed(1), `${parseFloat((parseFloat(item?.price) * parseFloat(item?.quantity)) - ((parseFloat(item?.price) * parseFloat(item?.quantity) * parseFloat(item?.discount)) / 100)).toFixed(1)}`],
                {},
              )
              : await BluetoothEscposPrinter.printColumn(
                columnWidthsProductsHeaderAndBody,
                [
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.CENTER,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                ],
                //@ts-ignore
                [
                  "",
                  item?.quantity.toString(),
                  item?.price.toString(),
                  calculateAmountDiscountPerProduct(
                    item?.quantity,
                    item?.discount,
                  ),
                  calculateAmountAfterAmountDiscountPerProduct(
                    item?.price,
                    item?.quantity,
                    item?.discount,
                  ),
                ],
                // ["", item?.quantity.toString(), item?.price.toString(), parseFloat(item?.discount).toFixed(1), `${parseFloat((parseFloat(item?.price) * parseFloat(item?.quantity)) - (parseFloat(item?.quantity) * parseFloat(item?.discount))).toFixed(1)}`],
                {},
              )
            : await BluetoothEscposPrinter.printColumn(
              columnWidthsProductsHeaderAndBodyWithoutDiscount,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              //@ts-ignore
              [
                "",
                item?.quantity.toString(),
                item?.price.toString(),
                calculateAmountAfterAmountDiscountPerProduct(
                  item?.price,
                  item?.quantity,
                  0,
                ),
              ],
              // : await BluetoothEscposPrinter.printColumn(
              //     columnWidthsProductsHeaderAndBody,
              //     [
              //         BluetoothEscposPrinter.ALIGN.LEFT,
              //         BluetoothEscposPrinter.ALIGN.LEFT,
              //         BluetoothEscposPrinter.ALIGN.CENTER,
              //         BluetoothEscposPrinter.ALIGN.RIGHT,
              //         BluetoothEscposPrinter.ALIGN.RIGHT,
              //     ],
              //     //@ts-ignore
              //     ["", item?.quantity.toString(), item?.price.toString(), calculateAmountDiscountPerProduct(item?.quantity, 0), calculateAmountAfterAmountDiscountPerProduct(item?.price, item?.quantity, 0)],
              // ["", item?.quantity.toString(), item?.price.toString(), parseFloat(item?.discount).toFixed(1), `${parseFloat((parseFloat(item?.price) * parseFloat(item?.quantity)) - (parseFloat(item?.quantity) * parseFloat(item?.discount))).toFixed(1)}`],
              {},
            )

          console.log("#####################################", item)
          console.log(
            "############++++++++++++++++++#######",
            (item?.price * item?.quantity - item?.discount).toFixed(2),
          )

          // await BluetoothEscposPrinter.printColumn(
          //     columnWidthsProductsHeaderAndBody,
          //     [
          //         BluetoothEscposPrinter.ALIGN.LEFT,
          //         BluetoothEscposPrinter.ALIGN.LEFT,
          //         BluetoothEscposPrinter.ALIGN.CENTER,
          //         BluetoothEscposPrinter.ALIGN.RIGHT,
          //         BluetoothEscposPrinter.ALIGN.RIGHT,
          //     ],
          //     ["", item?.quantity.toString(), item?.price.toString(), (((item?.price * item?.quantity * item?.discount) / 100).toFixed(2)).toString(), `${((item?.price * item?.quantity) - ((item?.price * item?.quantity * item?.discount) / 100)).toFixed(2).toString()}`],
          //     {},
          // )
        } else {
          receiptSettings?.discount_flag === "Y"
            ? receiptSettings?.discount_type === "P"
              ? await BluetoothEscposPrinter.printColumn(
                columnWidthsProductsHeaderAndBody,
                [
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.CENTER,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                ],
                //@ts-ignore
                [
                  item?.item_name,
                  item?.quantity.toString(),
                  item?.price.toString(),
                  calculatePercentDiscountPerProduct(
                    item?.price,
                    item?.quantity,
                    item?.discount,
                  ),
                  calculateAmountAfterPercentDiscountPerProduct(
                    item?.price,
                    item?.quantity,
                    item?.discount,
                  ),
                ],
                {},
              )
              : await BluetoothEscposPrinter.printColumn(
                columnWidthsProductsHeaderAndBody,
                [
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.CENTER,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                ],
                //@ts-ignore
                [
                  item?.item_name,
                  item?.quantity.toString(),
                  item?.price.toString(),
                  calculateAmountDiscountPerProduct(
                    item?.quantity,
                    item?.discount,
                  ),
                  calculateAmountAfterAmountDiscountPerProduct(
                    item?.price,
                    item?.quantity,
                    item?.discount,
                  ),
                ],
                {},
              )
            : await BluetoothEscposPrinter.printColumn(
              columnWidthsProductsHeaderAndBodyWithoutDiscount,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              //@ts-ignore
              [
                item?.item_name,
                item?.quantity.toString(),
                item?.price.toString(),
                calculateAmountAfterAmountDiscountPerProduct(
                  item?.price,
                  item?.quantity,
                  0,
                ),
              ],
              {},
            )
          // : await BluetoothEscposPrinter.printColumn(
          //     columnWidthsProductsHeaderAndBody,
          //     [
          //         BluetoothEscposPrinter.ALIGN.LEFT,
          //         BluetoothEscposPrinter.ALIGN.LEFT,
          //         BluetoothEscposPrinter.ALIGN.CENTER,
          //         BluetoothEscposPrinter.ALIGN.RIGHT,
          //         BluetoothEscposPrinter.ALIGN.RIGHT,
          //     ],
          //     //@ts-ignore
          //     [item?.item_name, item?.quantity.toString(), item?.price.toString(), calculateAmountDiscountPerProduct(item?.quantity, 0), calculateAmountAfterAmountDiscountPerProduct(item?.price, item?.quantity, 0)],
          //     {},
          // )

          // await BluetoothEscposPrinter.printColumn(
          //     columnWidthsProductsHeaderAndBody,
          //     [
          //         BluetoothEscposPrinter.ALIGN.LEFT,
          //         BluetoothEscposPrinter.ALIGN.LEFT,
          //         BluetoothEscposPrinter.ALIGN.CENTER,
          //         BluetoothEscposPrinter.ALIGN.RIGHT,
          //         BluetoothEscposPrinter.ALIGN.RIGHT,
          //     ],
          //     [item?.item_name, item?.quantity.toString(), item?.price.toString(), (((item?.price * item?.quantity * item?.discount) / 100).toFixed(2)).toString(), `${(item?.price * item?.quantity).toString()}`],
          //     {},
          // )
          await BluetoothEscposPrinter.printText("\n", {})
        }
      }

      // await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})

      await BluetoothEscposPrinter.printColumn(
        columnWidthsItemTotal,
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
        [
          `ITEM: ${addedProducts?.length?.toString()} QTY: ${totalQuantities.toString()}`,
          `AMT: ${netTotal?.toFixed(2)}`,
        ],
        {},
      )
      // await BluetoothEscposPrinter.printText("\n", {})

      // receiptSettings?.gst_type === "E"
      //     ? await BluetoothEscposPrinter.printColumn(
      //         columnWidths,
      //         [
      //             BluetoothEscposPrinter.ALIGN.LEFT,
      //             BluetoothEscposPrinter.ALIGN.CENTER,
      //             BluetoothEscposPrinter.ALIGN.RIGHT,
      //         ],
      //         // ["TOTAL", ":", `${(netTotal - totalDiscountAmount + totalGST).toFixed(2)}`],
      //         ["TOTAL", ":", `${netTotalWithGSTCalculate(netTotal, totalDiscountAmount, totalGST)}`],
      //         {},
      //     )
      //     : await BluetoothEscposPrinter.printColumn(
      //         columnWidths,
      //         [
      //             BluetoothEscposPrinter.ALIGN.LEFT,
      //             BluetoothEscposPrinter.ALIGN.CENTER,
      //             BluetoothEscposPrinter.ALIGN.RIGHT,
      //         ],
      //         // ["TOTAL", ":", `${(netTotal - totalDiscountAmount + totalGST).toFixed(2)}`],
      //         ["TOTAL", ":", `${totalAmountWithGSTInclCalculate(netTotal, totalGST)}`],
      //         {},
      //     )

      gstKeys.map(
        async key =>
          await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              `${key.includes("CGST") ? "CGST" : "SGST"} @${key
                .replace(/total(CGST|SGST)_/, "")
                .replace("_", ".")}%`,
              ":",
              gstTotals[key].toFixed(2),
            ],
            {},
          ),
      )

      await BluetoothEscposPrinter.printColumn(
        columnWidths,
        [
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.CENTER,
          BluetoothEscposPrinter.ALIGN.RIGHT,
        ],
        ["TOTAL GST", ":", totalGST.toFixed(2).toString()],
        {},
      )

      receiptSettings?.discount_flag === "Y" &&
        (await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          //@ts-ignore
          ["DISCOUNT", ":", parseFloat(totalDiscountAmount).toFixed(2)],
          {},
        ))

      receiptSettings?.gst_type === "E"
        ? await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          // ["TOTAL", ":", `${(netTotal - totalDiscountAmount + totalGST).toFixed(2)}`],
          [
            "TOTAL",
            ":",
            `${netTotalWithGSTCalculate(
              netTotal,
              totalDiscountAmount,
              totalGST,
            )}`,
          ],
          {},
        )
        : await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          // ["TOTAL", ":", `${(netTotal - totalDiscountAmount + totalGST).toFixed(2)}`],
          [
            "TOTAL",
            ":",
            `${netTotalWithGSTInclCalculate(netTotal, totalDiscountAmount)}`,
          ],
          {},
        )
      // : await BluetoothEscposPrinter.printColumn(
      //     columnWidths,
      //     [
      //         BluetoothEscposPrinter.ALIGN.LEFT,
      //         BluetoothEscposPrinter.ALIGN.CENTER,
      //         BluetoothEscposPrinter.ALIGN.RIGHT,
      //     ],
      //     // ["TOTAL", ":", `${(netTotal - totalDiscountAmount + totalGST).toFixed(2)}`],
      //     ["TOTAL", ":", `${totalAmountWithGSTInclCalculate(netTotal, totalGST)}`],
      //     {},
      // )

      // receiptSettings?.gst_flag === "Y"
      //     && await BluetoothEscposPrinter.printColumn(
      //         columnWidths,
      //         [
      //             BluetoothEscposPrinter.ALIGN.LEFT,
      //             BluetoothEscposPrinter.ALIGN.CENTER,
      //             BluetoothEscposPrinter.ALIGN.RIGHT,
      //         ],
      //         ["TOTAL GST", ":", (totalGST).toFixed(2).toString()],
      //         {},
      //     )

      receiptSettings?.gst_type === "E"
        ? await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          // ["ROUND OFF", ":", `${(Math.round(parseFloat((netTotal - totalDiscountAmount + totalGST).toFixed(2))) - parseFloat((netTotal - totalDiscountAmount + totalGST).toFixed(2))).toFixed(2)}`],
          [
            "ROUND OFF",
            ":",
            `${roundingOffWithGSTCalculate(
              netTotal,
              totalDiscountAmount,
              totalGST,
            )}`,
          ],
          {},
        )
        : await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          // ["ROUND OFF", ":", `${(Math.round(parseFloat((netTotal - totalDiscountAmount + totalGST).toFixed(2))) - parseFloat((netTotal - totalDiscountAmount + totalGST).toFixed(2))).toFixed(2)}`],
          [
            "ROUND OFF",
            ":",
            `${roundingOffWithGSTInclCalculate(
              netTotal,
              totalDiscountAmount,
            )}`,
          ],
          {},
        )

      // await BluetoothEscposPrinter.printColumn(
      //     columnWidths,
      //     [
      //         BluetoothEscposPrinter.ALIGN.LEFT,
      //         BluetoothEscposPrinter.ALIGN.CENTER,
      //         BluetoothEscposPrinter.ALIGN.RIGHT,
      //     ],
      //     // ["NET AMT", ":", `${Math.round(parseFloat((netTotal - totalDiscountAmount + totalGST).toFixed(2)))}`],
      //     ["NET AMT", ":", `${grandTotalWithGSTCalculate(netTotal, totalDiscountAmount, totalGST)}`],
      //     {},
      // )

      receiptSettings?.gst_type === "E"
        ? await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          // ["NET AMT", ":", `${Math.round(parseFloat((netTotal - totalDiscountAmount + totalGST).toFixed(2)))}`],
          [
            "NET AMT",
            ":",
            `${grandTotalWithGSTCalculate(
              netTotal,
              totalDiscountAmount,
              totalGST,
            )}`,
          ],
          {},
        )
        : await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          // ["NET AMT", ":", `${Math.round(parseFloat((netTotal - totalDiscountAmount + totalGST).toFixed(2)))}`],
          [
            "NET AMT",
            ":",
            `${grandTotalWithGSTInclCalculate(
              netTotal,
              totalDiscountAmount,
            )}`,
          ],
          {},
        )

      // await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })
      await BluetoothEscposPrinter.printText("\n", {})
      if (receiptSettings?.rcv_cash_flag === "Y") {
        if (paymentMode === "C") {
          await BluetoothEscposPrinter.printText("PAYMENT MODE", {
            align: "center",
          })
          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printText(
            `CASH RECEIVED:       ${cashAmount}`,
            { align: "center" },
          )
          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printText(
            `RETURNED AMT:        ${returnedAmt}`,
            { align: "center" },
          )

          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

          await BluetoothEscposPrinter.printText("------------------------", {
            align: "center",
          })
          await BluetoothEscposPrinter.printText("\n", {})
        }

      } else {
        await BluetoothEscposPrinter.printText(
          `TOTAL RETURNED AMT:        ${Math.abs(returnedAmt)}`,
          { align: "center" },
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})
      }
      if (paymentMode === "R") {
        await BluetoothEscposPrinter.printText("PAYMENT MODE", {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printText(
          `CASH RECEIVED:       ${cashAmount}`,
          { align: "center" },
        )
        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printText(
          `DUE AMT:        ${Math.abs(returnedAmt)}`,
          { align: "center" },
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})
      }
      if (paymentMode === "D") {
        // await BluetoothEscposPrinter.printText(
        //     `RECEIVED:       ${Math.round(parseFloat((netTotal - totalDiscountAmount + totalGST).toFixed(2)))} [CARD]`,
        //     { align: "center" },
        // )
        receiptSettings?.gst_type === "E"
          ? await BluetoothEscposPrinter.printText(
            `RECEIVED:       ${grandTotalWithGSTCalculate(
              netTotal,
              totalDiscountAmount,
              totalGST,
            )} [CARD]`,
            { align: "center" },
          )
          : await BluetoothEscposPrinter.printText(
            `RECEIVED:       ${grandTotalWithGSTInclCalculate(
              netTotal,
              totalDiscountAmount,
            )} [CARD]`,
            { align: "center" },
          )
        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})
      }
      if (paymentMode === "U") {
        receiptSettings?.gst_type === "E"
          ? await BluetoothEscposPrinter.printText(
            `RECEIVED:       ${grandTotalWithGSTCalculate(
              netTotal,
              totalDiscountAmount,
              totalGST,
            )} [UPI]`,
            { align: "center" },
          )
          : await BluetoothEscposPrinter.printText(
            `RECEIVED:       ${grandTotalWithGSTInclCalculate(
              netTotal,
              totalDiscountAmount,
            )} [UPI]`,
            { align: "center" },
          )
        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        if (upiData?.length > 0) {
          BluetoothEscposPrinter.printQRCode(
            `${upiData}&am=${receiptSettings?.gst_type === "E"
              ? grandTotalWithGSTCalculate(netTotal, totalDiscountAmount, totalGST)
              : grandTotalWithGSTInclCalculate(netTotal, totalDiscountAmount)
            }`,
            250,
            BluetoothEscposPrinter.ERROR_CORRECTION.L,
          )
        }
        await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText("------------------------", {
        //   align: "center",
        // })
      }

      if (receiptSettings?.on_off_flag3 === "Y") {
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
        await BluetoothEscposPrinter.printText("\n", {})
      }
      if (receiptSettings?.on_off_flag4 === "Y") {
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
      }
      await BluetoothEscposPrinter.printText("\n", {})

      // await BluetoothEscposPrinter.printText(
      //     "THANK YOU, VISIT AGAIN!",
      //     { align: "center" },
      // )
      // await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------X------", {
        textAlign: "center",
      })
      await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
    } catch (e) {
      console.log(e.message || "ERROR")
    }
  }
  async function printReceiptWithoutGst_old(
    addedProducts: ItemsData[],
    netTotal: number,
    totalDiscountAmount: number,
    cashAmount?: number,
    returnedAmt?: number,
    customerName?: string,
    customerPhone?: string,
    rcptNo?: number,
    paymentMode?: string,
    kotNo?: number,
    tableNo?: number,
  ) {
    const loginStore = JSON.parse(loginStorage.getString("login-data"))
    const fileStore = fileStorage.getString("comp_picture")
    const upiStore = fileStorage.getString("upi-blob")
    const upiData = fileStorage.getString("upi-data")

    const shopName: string = loginStore?.company_name?.toString()
    const address: string = loginStore?.address?.toString()
    const location: string = loginStore?.branch_name?.toString()
    const shopMobile: string = loginStore?.phone_no?.toString()
    const shopEmail: string = loginStore?.email_id?.toString()
    const cashier: string = loginStore?.user_name?.toString()

    let totalQuantities: number = 0
    let totalAmountAfterDiscount: number = 0

    try {
      let columnWidths = [11, 1, 18]
      let columnWidthsHeader = [8, 1, 21]
      let columnWidthsProductsHeaderAndBody = [8, 4, 6, 5, 7]
      let columnWidthsProductsHeaderAndBodyWithoutDiscount = [8, 6, 7, 8]
      // let columnWidthsProductsHeaderAndBody = [18, 3, 4, 3, 4]
      let columnWidthsItemTotal = [18, 12]
      let columnWidthIfNameIsBig = [32]
      let columnWidthForKot = [10, 22]

      // let newColumnWidths: number[] = [9, 9, 6, 7]






      if (receiptSettings?.kot_flag === "Y") {

        await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
          align: "center",
          widthtimes: 1.2,
          heigthtimes: 2,
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("-------------------------", {})
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printColumn(
          columnWidthForKot,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["KOT NO.", `${kotNo}`],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidthForKot,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["TABLE NO.", `${tableNo || 0}`],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidthForKot,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["DT.", `${new Date().toLocaleString("en-GB")}`],
          {},
        )

        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("-------------------------", {})
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printColumn(
          columnWidthForKot,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["ITEM", `QTY`],
          {},
        )

        for (const item of addedProducts) {
          if (item?.item_name?.length > 10) {
            await BluetoothEscposPrinter.printColumn(
              columnWidthIfNameIsBig,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
              ],
              [`${item?.item_name}`],
              {},
            )
            await BluetoothEscposPrinter.printColumn(
              columnWidthIfNameIsBig,
              [
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              [`${item?.quantity}`],
              {},
            )
            // await BluetoothEscposPrinter.printText("\n", {})
            // await BluetoothEscposPrinter.printText(`${item.quantity}`, { align: "right" })
          } else {
            await BluetoothEscposPrinter.printColumn(
              columnWidthForKot,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              [`${item?.item_name}`, `${item?.quantity}`],
              {},
            )
          }
        }

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("-------------------------", {})
        await BluetoothEscposPrinter.printText("\n\n\n", {})


      }







      if (fileStore?.length > 0) {
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        const options = {
          width: 250, // Assuming 58mm paper width with 8 dots/mm resolution (58mm * 8dots/mm = 384 dots)
          left: 50, // No left padding
          // align: "CENTER"
        }

        // Print the image
        const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
          ? fileStore.split("data:application/octet-stream;base64,")[1]

          : fileStore
        console.log(pureBase64, 'purbase64 er indicator dao reprint!')
        if (receiptSettings?.logo_flag == 'Y')
          await BluetoothEscposPrinter.printPic(pureBase64, options)
        // await BluetoothEscposPrinter.printPic(fileStore, options)
      }

      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.CENTER,
      )
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
        align: "center",
        widthtimes: 1.2,
        heigthtimes: 2,
      })
      await BluetoothEscposPrinter.printText("\n", {})
      // await BluetoothEscposPrinter.printText("hasifughaf", { align: "center" })

      if (receiptSettings?.on_off_flag1 === "Y") {
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(receiptSettings?.header1, { align: "center" })
        await BluetoothEscposPrinter.printText("\n", {})
      }

      if (receiptSettings?.on_off_flag2 === "Y") {
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(receiptSettings?.header2, { align: "center" })
      }
      await BluetoothEscposPrinter.printText("\n", {})

      await BluetoothEscposPrinter.printText("RECEIPT", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})

      // await BluetoothEscposPrinter.printText("------------------------", {
      //   align: "center",
      // })

      // await BluetoothEscposPrinter.printText("\n", {})
      // await BluetoothEscposPrinter.printText(address, {
      //   align: "center",
      // })
      // await BluetoothEscposPrinter.printText("\n", {})
      // await BluetoothEscposPrinter.printText(location, {
      //   align: "center",
      // })
      // await BluetoothEscposPrinter.printText("\n", {})
      // await BluetoothEscposPrinter.printText("------------------------", {
      //   align: "center",
      // })
      // await BluetoothEscposPrinter.printText("\n", {})

      // // await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT)

      // await BluetoothEscposPrinter.printColumn(
      //   columnWidthsHeader,
      //   [
      //     BluetoothEscposPrinter.ALIGN.LEFT,
      //     BluetoothEscposPrinter.ALIGN.CENTER,
      //     BluetoothEscposPrinter.ALIGN.RIGHT,
      //   ],
      //   ["MOBILE", ":", shopMobile],
      //   {},
      // )
      // await BluetoothEscposPrinter.printColumn(
      //   columnWidthsHeader,
      //   [
      //     BluetoothEscposPrinter.ALIGN.LEFT,
      //     BluetoothEscposPrinter.ALIGN.CENTER,
      //     BluetoothEscposPrinter.ALIGN.RIGHT,
      //   ],
      //   ["EMAIL", ":", shopEmail],
      //   {},
      // )
      // await BluetoothEscposPrinter.printColumn(
      //     columnWidthsHeader,
      //     [
      //         BluetoothEscposPrinter.ALIGN.LEFT,
      //         BluetoothEscposPrinter.ALIGN.CENTER,
      //         BluetoothEscposPrinter.ALIGN.RIGHT,
      //     ],
      //     ["SITE", ":", "SHOPNAME.COM"],
      //     {},
      // )
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })
      await BluetoothEscposPrinter.printText("\n", {})

      await BluetoothEscposPrinter.printColumn(
        columnWidthsHeader,
        [
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.CENTER,
          BluetoothEscposPrinter.ALIGN.RIGHT,
        ],
        ["RCPT.NO", ":", rcptNo?.toString()],
        {},
      )
      await BluetoothEscposPrinter.printColumn(
        columnWidthsHeader,
        [
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.CENTER,
          BluetoothEscposPrinter.ALIGN.RIGHT,
        ],
        ["DATE", ":", `${new Date().toLocaleString("en-GB")}`],
        {},
      )
      await BluetoothEscposPrinter.printColumn(
        columnWidthsHeader,
        [
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.CENTER,
          BluetoothEscposPrinter.ALIGN.RIGHT,
        ],
        ["CASHIER", ":", cashier],
        {},
      )
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })
      await BluetoothEscposPrinter.printText("\n", {})

      if (customerName.length !== 0 || customerPhone.length !== 0) {
        receiptSettings?.cust_inf === "Y" &&
          (await BluetoothEscposPrinter.printColumn(
            columnWidthsHeader,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ["NAME", ":", customerName],
            {},
          ))
        // await BluetoothEscposPrinter.printColumn(
        //   columnWidthsHeader,
        //   [
        //     BluetoothEscposPrinter.ALIGN.LEFT,
        //     BluetoothEscposPrinter.ALIGN.CENTER,
        //     BluetoothEscposPrinter.ALIGN.RIGHT,
        //   ],
        //   ["PHONE", ":", customerPhone],
        //   {},
        // )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
      }

      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.CENTER,
      )

      receiptSettings?.discount_flag === "Y" &&
        receiptSettings?.discount_position !== "B"
        ? await BluetoothEscposPrinter.printColumn(
          columnWidthsProductsHeaderAndBody,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["ITEM", "QTY", "MRP", "DIS.", "TOT AMT"],
          {},
        )
        : await BluetoothEscposPrinter.printColumn(
          columnWidthsProductsHeaderAndBodyWithoutDiscount,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["ITEM", "QTY", "MRP", "TOT AMT"],
          {},
        )
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})

      for (const item of addedProducts) {
        //@ts-ignore
        totalQuantities += parseInt(item?.quantity)
        // receiptSettings?.discount_type === "P"
        //     ? totalAmountAfterDiscount += ((item?.price * item?.quantity) - ((item?.price * item?.quantity * item?.discount) / 100))
        //     : totalAmountAfterDiscount += ((item?.price * item?.quantity) - (item?.quantity * item?.discount))

        console.log("##########@@@@@@@@@@@@@@@", item)

        if (item?.item_name?.length >= 8) {
          await BluetoothEscposPrinter.printColumn(
            columnWidthIfNameIsBig,
            [BluetoothEscposPrinter.ALIGN.LEFT],
            [item?.item_name],
            {},
          )

          receiptSettings?.discount_flag === "Y" &&
            receiptSettings?.discount_position !== "B"
            ? receiptSettings?.discount_type === "P"
              ? await BluetoothEscposPrinter.printColumn(
                columnWidthsProductsHeaderAndBody,
                [
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.CENTER,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                ],
                //@ts-ignore
                [
                  "",
                  item?.quantity.toString(),
                  item?.price.toString(),
                  calculatePercentDiscountPerProduct(
                    item?.price,
                    item?.quantity,
                    item?.discount,
                  ),
                  calculateAmountAfterPercentDiscountPerProduct(
                    item?.price,
                    item?.quantity,
                    item?.discount,
                  ),
                ],
                {},
              )
              : await BluetoothEscposPrinter.printColumn(
                columnWidthsProductsHeaderAndBody,
                [
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.CENTER,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                ],
                //@ts-ignore
                [
                  "",
                  item?.quantity.toString(),
                  item?.price.toString(),
                  calculateAmountDiscountPerProduct(
                    item?.quantity,
                    item?.discount,
                  ),
                  calculateAmountAfterAmountDiscountPerProduct(
                    item?.price,
                    item?.quantity,
                    item?.discount,
                  ),
                ],
                {},
              )
            : await BluetoothEscposPrinter.printColumn(
              columnWidthsProductsHeaderAndBodyWithoutDiscount,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              //@ts-ignore
              [
                "",
                item?.quantity.toString(),
                item?.price.toString(),
                calculateAmountAfterAmountDiscountPerProduct(
                  item?.price,
                  item?.quantity,
                  0,
                ),
              ],
              {},
            )
          // : await BluetoothEscposPrinter.printColumn(
          //     columnWidthsProductsHeaderAndBody,
          //     [
          //         BluetoothEscposPrinter.ALIGN.LEFT,
          //         BluetoothEscposPrinter.ALIGN.LEFT,
          //         BluetoothEscposPrinter.ALIGN.CENTER,
          //         BluetoothEscposPrinter.ALIGN.RIGHT,
          //         BluetoothEscposPrinter.ALIGN.RIGHT,
          //     ],
          //     //@ts-ignore
          //     ["", item?.quantity.toString(), item?.price.toString(), calculateAmountDiscountPerProduct(item?.quantity, 0), calculateAmountAfterAmountDiscountPerProduct(item?.price, item?.quantity, 0)],
          //     {},
          // )

          // await BluetoothEscposPrinter.printColumn(
          //     columnWidthsProductsHeaderAndBody,
          //     [
          //         BluetoothEscposPrinter.ALIGN.LEFT,
          //         BluetoothEscposPrinter.ALIGN.LEFT,
          //         BluetoothEscposPrinter.ALIGN.CENTER,
          //         BluetoothEscposPrinter.ALIGN.RIGHT,
          //         BluetoothEscposPrinter.ALIGN.RIGHT,
          //     ],
          //     ["", item?.quantity.toString(), item?.price.toString(), (((item?.price * item?.quantity * item?.discount) / 100).toFixed(2)).toString(), `${((item?.price * item?.quantity) - ((item?.price * item?.quantity * item?.discount) / 100)).toFixed(2).toString()}`],
          //     {},
          // )
        } else {
          receiptSettings?.discount_flag === "Y"
            ? receiptSettings?.discount_type === "P"
              ? await BluetoothEscposPrinter.printColumn(
                columnWidthsProductsHeaderAndBody,
                [
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.CENTER,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                ],
                //@ts-ignore
                [
                  item?.item_name,
                  item?.quantity.toString(),
                  item?.price.toString(),
                  calculatePercentDiscountPerProduct(
                    item?.price,
                    item?.quantity,
                    item?.discount,
                  ),
                  calculateAmountAfterPercentDiscountPerProduct(
                    item?.price,
                    item?.quantity,
                    item?.discount,
                  ),
                ],
                {},
              )
              : await BluetoothEscposPrinter.printColumn(
                columnWidthsProductsHeaderAndBody,
                [
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.CENTER,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                ],
                //@ts-ignore
                [
                  item?.item_name,
                  item?.quantity.toString(),
                  item?.price.toString(),
                  calculateAmountDiscountPerProduct(
                    item?.quantity,
                    item?.discount,
                  ),
                  calculateAmountAfterAmountDiscountPerProduct(
                    item?.price,
                    item?.quantity,
                    item?.discount,
                  ),
                ],
                {},
              )
            : await BluetoothEscposPrinter.printColumn(
              columnWidthsProductsHeaderAndBodyWithoutDiscount,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              //@ts-ignore
              [
                item?.item_name,
                item?.quantity.toString(),
                item?.price.toString(),
                calculateAmountAfterAmountDiscountPerProduct(
                  item?.price,
                  item?.quantity,
                  0,
                ),
              ],
              {},
            )
          // : await BluetoothEscposPrinter.printColumn(
          //     columnWidthsProductsHeaderAndBody,
          //     [
          //         BluetoothEscposPrinter.ALIGN.LEFT,
          //         BluetoothEscposPrinter.ALIGN.LEFT,
          //         BluetoothEscposPrinter.ALIGN.CENTER,
          //         BluetoothEscposPrinter.ALIGN.RIGHT,
          //         BluetoothEscposPrinter.ALIGN.RIGHT,
          //     ],
          //     //@ts-ignore
          //     [item?.item_name, item?.quantity.toString(), item?.price.toString(), calculateAmountDiscountPerProduct(item?.quantity, 0), calculateAmountAfterAmountDiscountPerProduct(item?.price, item?.quantity, 0)],
          //     {},
          // )

          // await BluetoothEscposPrinter.printColumn(
          //     columnWidthsProductsHeaderAndBody,
          //     [
          //         BluetoothEscposPrinter.ALIGN.LEFT,
          //         BluetoothEscposPrinter.ALIGN.LEFT,
          //         BluetoothEscposPrinter.ALIGN.CENTER,
          //         BluetoothEscposPrinter.ALIGN.RIGHT,
          //         BluetoothEscposPrinter.ALIGN.RIGHT,
          //     ],
          //     [item?.item_name, item?.quantity.toString(), item?.price.toString(), (((item?.price * item?.quantity * item?.discount) / 100).toFixed(2)).toString(), `${(item?.price * item?.quantity).toString()}`],
          //     {},
          // )
          // await BluetoothEscposPrinter.printText("\n", {})
        }
      }

      // await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})

      await BluetoothEscposPrinter.printColumn(
        columnWidthsItemTotal,
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
        [
          `ITEM: ${addedProducts?.length?.toString()} QTY: ${totalQuantities.toString()}`,
          `AMT: ${netTotal?.toFixed(2)}`,
        ],
        {},
      )
      // await BluetoothEscposPrinter.printText("\n", {})

      receiptSettings?.discount_flag === "Y" &&
        (await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          //@ts-ignore
          ["DISCOUNT", ":", parseFloat(totalDiscountAmount).toFixed(2)],
          {},
        ))
      await BluetoothEscposPrinter.printColumn(
        columnWidths,
        [
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.CENTER,
          BluetoothEscposPrinter.ALIGN.RIGHT,
        ],
        ["TOTAL", ":", netTotalCalculate(netTotal, totalDiscountAmount)],
        {},
      )
      await BluetoothEscposPrinter.printColumn(
        columnWidths,
        [
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.CENTER,
          BluetoothEscposPrinter.ALIGN.RIGHT,
        ],
        // ["ROUND OFF", ":", `${(Math.round(parseFloat((netTotal - totalDiscountAmount).toFixed(2))) - parseFloat((netTotal - totalDiscountAmount).toFixed(2))).toFixed(2)}`],
        [
          "ROUND OFF",
          ":",
          `${roundingOffCalculate(netTotal, totalDiscountAmount)}`,
        ],
        {},
      )
      await BluetoothEscposPrinter.printColumn(
        columnWidths,
        [
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.CENTER,
          BluetoothEscposPrinter.ALIGN.RIGHT,
        ],
        // ["NET AMT", ":", `${Math.round(parseFloat((netTotal - totalDiscountAmount).toFixed(2)))}`],
        [
          "NET AMT",
          ":",
          `${grandTotalCalculate(netTotal, totalDiscountAmount)}`,
        ],
        {},
      )

      // await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })
      await BluetoothEscposPrinter.printText("\n", {})
      if (receiptSettings?.rcv_cash_flag === "Y") {
        if (paymentMode === "C") {
          await BluetoothEscposPrinter.printText("PAYMENT MODE", {
            align: "center",
          })
          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printText(
            `CASH RECEIVED:       ${cashAmount}`,
            { align: "center" },
          )
          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printText(
            `RETURNED AMT:        ${returnedAmt}`,
            { align: "center" },
          )

          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

          await BluetoothEscposPrinter.printText("------------------------", {
            align: "center",
          })
          await BluetoothEscposPrinter.printText("\n", {})
        }
      } else {
        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printText(
          `TOTAL RETURNED AMT:        ${Math.abs(returnedAmt)}`,
          { align: "center" },
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})
      }

      if (paymentMode === "R") {
        await BluetoothEscposPrinter.printText("PAYMENT MODE", {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printText(
          `CASH RECEIVED:       ${cashAmount}`,
          { align: "center" },
        )
        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printText(
          `DUE AMT:        ${Math.abs(returnedAmt)}`,
          { align: "center" },
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})
      }

      if (paymentMode === "D") {
        await BluetoothEscposPrinter.printText(
          `RECEIVED:       ${grandTotalCalculate(
            netTotal,
            totalDiscountAmount,
          )} [CARD]`,
          { align: "center" },
        )
        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})
      }

      if (paymentMode === "U") {
        await BluetoothEscposPrinter.printText(
          `RECEIVED:       ${grandTotalCalculate(
            netTotal,
            totalDiscountAmount,
          )} [UPI]`,
          { align: "center" },
        )
        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        if (upiData?.length > 0) {
          BluetoothEscposPrinter.printQRCode(
            `${upiData}&am=${grandTotalCalculate(netTotal, totalDiscountAmount)}`,
            250,
            BluetoothEscposPrinter.ERROR_CORRECTION.L,
          )
        }
        await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText("------------------------", {
        //   align: "center",
        // })
      }
      // await BluetoothEscposPrinter.printText("\n", {})

      if (receiptSettings?.on_off_flag3 === "Y") {
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
        await BluetoothEscposPrinter.printText("\n", {})
      }
      if (receiptSettings?.on_off_flag4 === "Y") {
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
      }
      await BluetoothEscposPrinter.printText("\n", {})

      // await BluetoothEscposPrinter.printText(
      //     "THANK YOU, VISIT AGAIN!",
      //     { align: "center" },
      // )
      // await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------X------", {})
      await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
    } catch (e) {
      console.log(e.message || "ERROR")
    }
  }
  async function printReceiptWithoutGst(
    addedProducts: ItemsData[],
    netTotal: number,
    totalDiscountAmount: number,
    cashAmount?: number,
    returnedAmt?: number,
    customerName?: string,
    customerPhone?: string,
    rcptNo?: number,
    paymentMode?: string,
    kotNo?: number,
    tableNo?: number,
  ) {
    const loginStore = JSON.parse(loginStorage.getString("login-data"))
    const fileStore = fileStorage.getString("comp_picture")
    const upiStore = fileStorage.getString("upi-blob")
    const upiData = fileStorage.getString("upi-data")
    console.log('withoutgst')
    const shopName: string = loginStore?.company_name?.toString()
    const address: string = loginStore?.address?.toString()
    const location: string = loginStore?.branch_name?.toString()
    const shopMobile: string = loginStore?.phone_no?.toString()
    const shopEmail: string = loginStore?.email_id?.toString()
    const cashier: string = loginStore?.user_name?.toString()

    let totalQuantities: number = 0
    let totalAmountAfterDiscount: number = 0
    function wrapText(text: string, maxLen: number) {
      const lines: string[] = [];
      let current = text;

      while (current.length > maxLen) {
        // find space to break on
        let idx = current.lastIndexOf(" ", maxLen);
        if (idx <= 0) idx = maxLen; // hard break if no space
        lines.push(current.slice(0, idx));
        current = current.slice(idx).trim();
      }

      if (current.length > 0) {
        lines.push(current);
      }

      return lines;
    }
    try {
      if (receiptSettings?.print_op === "3") {
        let columnWidths = [20, 1, 27]
        let columnWidthsHeader = [15, 1, 32]
        let columnWidthsProductsHeaderAndBody = [18, 4, 8, 8, 10]
        let columnWidthsProductsHeaderAndBodyWithoutDiscount = [24, 6, 9, 9]
        let columnWidthsItemTotal = [30, 18]
        let columnWidthIfNameIsBig = [48]
        let columnWidthForKot = [15, 33]
        const separator = "------------------------------------------------"

        if (receiptSettings?.kot_flag === "Y") {
          if (tableNo) {
            await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
              align: "center",
              widthtimes: 1.2,
              heigthtimes: 2,
            })

            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printerAlign(
              BluetoothEscposPrinter.ALIGN.CENTER,
            )

            await BluetoothEscposPrinter.printText(separator, {})
            await BluetoothEscposPrinter.printText("\n", {})

            await BluetoothEscposPrinter.printColumn(
              columnWidthForKot,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              ["KOT NO.", `${kotNo}`],
              {},
            )

            await BluetoothEscposPrinter.printColumn(
              columnWidthForKot,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              ["TABLE NO.", `${tableNo || 0}`],
              {},
            )

            await BluetoothEscposPrinter.printColumn(
              columnWidthForKot,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              ["DT.", `${new Date().toLocaleString("en-GB")}`],
              {},
            )

            await BluetoothEscposPrinter.printerAlign(
              BluetoothEscposPrinter.ALIGN.CENTER,
            )

            await BluetoothEscposPrinter.printText(separator, {})
            await BluetoothEscposPrinter.printText("\n", {})

            await BluetoothEscposPrinter.printColumn(
              columnWidthForKot,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              ["ITEM", `QTY`],
              {},
            )

            for (const item of addedProducts) {
              if (item?.item_name?.length > 10) {
                await BluetoothEscposPrinter.printColumn(
                  columnWidthIfNameIsBig,
                  [BluetoothEscposPrinter.ALIGN.LEFT],
                  // [`${item?.item_name}`],
                  [`${item?.item_name}aaaaaaaa`],
                  {},
                )
                await BluetoothEscposPrinter.printColumn(
                  columnWidthIfNameIsBig,
                  [BluetoothEscposPrinter.ALIGN.RIGHT],
                  [`${item?.quantity}`],
                  {},
                )
              } else {
                await BluetoothEscposPrinter.printColumn(
                  columnWidthForKot,
                  [
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                  ],
                  [`${item?.item_name}`, `${item?.quantity}`],
                  {},
                )
              }
            }

            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printerAlign(
              BluetoothEscposPrinter.ALIGN.CENTER,
            )

            await BluetoothEscposPrinter.printText(separator, {})
            await BluetoothEscposPrinter.printText("\n\n\n", {})
          }
        }

        if (fileStore?.length > 0) {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          const options = {
            width: 375, // Assuming 80mm paper
            left: 50,
          }
          const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
            ? fileStore.split("data:application/octet-stream;base64,")[1]

            : fileStore
          console.log(pureBase64, 'purbase64 er indicator dao reprint!')
          if (receiptSettings?.logo_flag == 'Y')
            await BluetoothEscposPrinter.printPic(pureBase64, options)

          // await BluetoothEscposPrinter.printPic(fileStore, options)
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
          align: "center",
          widthtimes: 1.2,
          heigthtimes: 2,
        })
        await BluetoothEscposPrinter.printText("\n", {})

        if (receiptSettings?.on_off_flag1 === "Y") {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText(receiptSettings?.header1, {
            align: "center",
          })
          await BluetoothEscposPrinter.printText("\n", {})
        }

        if (receiptSettings?.on_off_flag2 === "Y") {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText(receiptSettings?.header2, {
            align: "center",
          })
        }
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText("RECEIPT", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText(separator, {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeader,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["RCPT.NO", ":", rcptNo?.toString()],
          {},
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeader,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["DATE", ":", `${new Date().toLocaleString("en-GB")}`],
          {},
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeader,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["CASHIER", ":", cashier],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText(separator, {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})

        if (customerName.length !== 0 || customerPhone.length !== 0) {
          receiptSettings?.cust_inf === "Y" &&
            (await BluetoothEscposPrinter.printColumn(
              columnWidthsHeader,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.CENTER,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              ["NAME", ":", customerName],
              {},
            ))
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText(separator, {
            align: "center",
          })

          await BluetoothEscposPrinter.printText("\n", {})
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        receiptSettings?.discount_flag === "Y" &&
          receiptSettings?.discount_position !== "B"
          ? await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ["ITEM", "QTY", "MRP", "DIS.", "TOT AMT"],
            {},
          )
          : await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBodyWithoutDiscount,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ["ITEM", "QTY", "MRP", "TOT AMT"],
            {},
          )
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText(separator, {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        for (const item of addedProducts) {
          //@ts-ignore
          totalQuantities += parseInt(item?.quantity)

          const maxLen =
            receiptSettings?.discount_flag === "Y" &&
              receiptSettings?.discount_position !== "B"
              ? 18
              : 24;
          const nameLines = wrapText(item.item_name, maxLen);

          for (let i = 0; i < nameLines.length; i++) {
            const currentItemName = nameLines[i] || "";

            if (i < nameLines.length - 1) {
              await BluetoothEscposPrinter.printColumn(
                columnWidthIfNameIsBig,
                [BluetoothEscposPrinter.ALIGN.LEFT],
                [currentItemName],
                {},
              );
              await BluetoothEscposPrinter.printText("\n", {});
            } else {
              receiptSettings?.discount_flag === "Y" &&
                receiptSettings?.discount_position !== "B"
                ? receiptSettings?.discount_type === "P"
                  ? await BluetoothEscposPrinter.printColumn(
                    columnWidthsProductsHeaderAndBody,
                    [
                      BluetoothEscposPrinter.ALIGN.LEFT,
                      BluetoothEscposPrinter.ALIGN.LEFT,
                      BluetoothEscposPrinter.ALIGN.CENTER,
                      BluetoothEscposPrinter.ALIGN.RIGHT,
                      BluetoothEscposPrinter.ALIGN.RIGHT,
                    ],
                    //@ts-ignore
                    [
                      currentItemName,
                      item?.quantity.toString(),
                      item?.price.toString(),
                      calculatePercentDiscountPerProduct(
                        item?.price,
                        item?.quantity,
                        item?.discount,
                      ),
                      calculateAmountAfterPercentDiscountPerProduct(
                        item?.price,
                        item?.quantity,
                        item?.discount,
                      ),
                    ],
                    {},
                  )
                  : await BluetoothEscposPrinter.printColumn(
                    columnWidthsProductsHeaderAndBody,
                    [
                      BluetoothEscposPrinter.ALIGN.LEFT,
                      BluetoothEscposPrinter.ALIGN.LEFT,
                      BluetoothEscposPrinter.ALIGN.CENTER,
                      BluetoothEscposPrinter.ALIGN.RIGHT,
                      BluetoothEscposPrinter.ALIGN.RIGHT,
                    ],
                    //@ts-ignore
                    [
                      currentItemName,
                      item?.quantity.toString(),
                      item?.price.toString(),
                      calculateAmountDiscountPerProduct(
                        item?.quantity,
                        item?.discount,
                      ),
                      calculateAmountAfterAmountDiscountPerProduct(
                        item?.price,
                        item?.quantity,
                        item?.discount,
                      ),
                    ],
                    {},
                  )
                : await BluetoothEscposPrinter.printColumn(
                  columnWidthsProductsHeaderAndBodyWithoutDiscount,
                  [
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                  ],
                  //@ts-ignore
                  [
                    currentItemName,
                    item?.quantity.toString(),
                    item?.price.toString(),
                    calculateAmountAfterAmountDiscountPerProduct(
                      item?.price,
                      item?.quantity,
                      0,
                    ),
                  ],
                  {},
                )
              await BluetoothEscposPrinter.printText("\n", {});
            }
          }
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText(separator, {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printColumn(
          columnWidthsItemTotal,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            `ITEM: ${addedProducts?.length?.toString()} QTY: ${totalQuantities.toString()}`,
            `AMT: ${netTotal?.toFixed(2)}`,
          ],
          {},
        )

        receiptSettings?.discount_flag === "Y" &&
          (await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            //@ts-ignore
            ["DISCOUNT", ":", parseFloat(totalDiscountAmount).toFixed(2)],
            {},
          ))
        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["TOTAL", ":", netTotalCalculate(netTotal, totalDiscountAmount)],
          {},
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            "ROUND OFF",
            ":",
            `${roundingOffCalculate(netTotal, totalDiscountAmount)}`,
          ],
          {},
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            "NET AMT",
            ":",
            `${grandTotalCalculate(netTotal, totalDiscountAmount)}`,
          ],
          {},
        )

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText(separator, {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})
        if (receiptSettings?.rcv_cash_flag === "Y") {
          if (paymentMode === "C") {
            await BluetoothEscposPrinter.printText("PAYMENT MODE", {
              align: "center",
            })
            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printText(
              `CASH RECEIVED:       ${cashAmount}`,
              { align: "center" },
            )
            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printText(
              `RETURNED AMT:        ${returnedAmt}`,
              { align: "center" },
            )

            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printerAlign(
              BluetoothEscposPrinter.ALIGN.CENTER,
            )

            await BluetoothEscposPrinter.printText(separator, {
              align: "center",
            })
            await BluetoothEscposPrinter.printText("\n", {})
          }
        } else {
          await BluetoothEscposPrinter.printText(
            `TOTAL RETURNED AMT:        ${Math.abs(returnedAmt)}`,
            { align: "center" },
          )

          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText(separator, {
            align: "center",
          })
          await BluetoothEscposPrinter.printText("\n", {})
        }

        if (paymentMode === "R") {
          await BluetoothEscposPrinter.printText("PAYMENT MODE", {
            align: "center",
          })
          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printText(
            `CASH RECEIVED:       ${cashAmount}`,
            { align: "center" },
          )
          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printText(
            `DUE AMT:        ${Math.abs(returnedAmt)}`,
            { align: "center" },
          )

          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText(separator, {
            align: "center",
          })
          await BluetoothEscposPrinter.printText("\n", {})
        }

        if (paymentMode === "D") {
          await BluetoothEscposPrinter.printText(
            `RECEIVED:       ${grandTotalCalculate(
              netTotal,
              totalDiscountAmount,
            )} [CARD]`,
            { align: "center" },
          )
          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText(separator, {
            align: "center",
          })
          await BluetoothEscposPrinter.printText("\n", {})
        }

        if (paymentMode === "U") {
          await BluetoothEscposPrinter.printText(
            `RECEIVED:       ${grandTotalCalculate(
              netTotal,
              totalDiscountAmount,
            )} [UPI]`,
            { align: "center" },
          )
          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText(separator, {
            align: "center",
          })

          if (upiData?.length > 0) {
            BluetoothEscposPrinter.printQRCode(
              `${upiData}&am=${grandTotalCalculate(
                netTotal,
                totalDiscountAmount,
              )}`,
              380, // Adjusted for 3-inch
              BluetoothEscposPrinter.ERROR_CORRECTION.L,
            )
          }
          await BluetoothEscposPrinter.printText("\n", {})
        }

        if (receiptSettings?.on_off_flag3 === "Y") {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
          await BluetoothEscposPrinter.printText("\n", {})
        }
        if (receiptSettings?.on_off_flag4 === "Y") {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
        }
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText("------X------", {})
        await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
      } else {
        let columnWidths = [11, 1, 18]
        let columnWidthsHeader = [8, 1, 21]
        let columnWidthsProductsHeaderAndBody = [8, 4, 6, 5, 7]
        let columnWidthsProductsHeaderAndBodyWithoutDiscount = [8, 6, 7, 8]
        let columnWidthsItemTotal = [18, 12]
        let columnWidthIfNameIsBig = [32]
        let columnWidthForKot = [10, 22]

        if (receiptSettings?.kot_flag === "Y") {
          if (tableNo) {
            await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
              align: "center",
              widthtimes: 1.2,
              heigthtimes: 2,
            })

            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printerAlign(
              BluetoothEscposPrinter.ALIGN.CENTER,
            )

            await BluetoothEscposPrinter.printText(
              "-------------------------",
              {},
            )
            await BluetoothEscposPrinter.printText("\n", {})

            await BluetoothEscposPrinter.printColumn(
              columnWidthForKot,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              ["KOT NO.", `${kotNo}`],
              {},
            )

            await BluetoothEscposPrinter.printColumn(
              columnWidthForKot,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              ["TABLE NO.", `${tableNo || 0}`],
              {},
            )

            await BluetoothEscposPrinter.printColumn(
              columnWidthForKot,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              ["DT.", `${new Date().toLocaleString("en-GB")}`],
              {},
            )

            await BluetoothEscposPrinter.printerAlign(
              BluetoothEscposPrinter.ALIGN.CENTER,
            )

            await BluetoothEscposPrinter.printText(
              "-------------------------",
              {},
            )
            await BluetoothEscposPrinter.printText("\n", {})

            await BluetoothEscposPrinter.printColumn(
              columnWidthForKot,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              ["ITEM", `QTY`],
              {},
            )

            for (const item of addedProducts) {
              if (item?.item_name?.length > 10) {
                await BluetoothEscposPrinter.printColumn(
                  columnWidthIfNameIsBig,
                  [BluetoothEscposPrinter.ALIGN.LEFT],
                  [`${item?.item_name}`],
                  {},
                )
                await BluetoothEscposPrinter.printColumn(
                  columnWidthIfNameIsBig,
                  [BluetoothEscposPrinter.ALIGN.RIGHT],
                  [`${item?.quantity}`],
                  {},
                )
              } else {
                await BluetoothEscposPrinter.printColumn(
                  columnWidthForKot,
                  [
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                  ],
                  [`${item?.item_name}`, `${item?.quantity}`],
                  {},
                )
              }
            }

            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printerAlign(
              BluetoothEscposPrinter.ALIGN.CENTER,
            )

            await BluetoothEscposPrinter.printText(
              "-------------------------",
              {},
            )
            await BluetoothEscposPrinter.printText("\n\n\n", {})
          }
        }

        if (fileStore?.length > 0) {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          const options = {
            width: 250,
            left: 50,
          }
          const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
            ? fileStore.split("data:application/octet-stream;base64,")[1]

            : fileStore
          console.log(pureBase64, 'purbase64 er indicator dao reprint!')
          if (receiptSettings?.logo_flag == 'Y')
            await BluetoothEscposPrinter.printPic(pureBase64, options)
          // await BluetoothEscposPrinter.printPic(fileStore, options)
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
          align: "center",
          widthtimes: 1.2,
          heigthtimes: 2,
        })
        await BluetoothEscposPrinter.printText("\n", {})

        if (receiptSettings?.on_off_flag1 === "Y") {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText(receiptSettings?.header1, {
            align: "center",
          })
          await BluetoothEscposPrinter.printText("\n", {})
        }

        if (receiptSettings?.on_off_flag2 === "Y") {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText(receiptSettings?.header2, {
            align: "center",
          })
        }
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText("RECEIPT", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeader,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["RCPT.NO", ":", rcptNo?.toString()],
          {},
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeader,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["DATE", ":", `${new Date().toLocaleString("en-GB")}`],
          {},
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeader,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["CASHIER", ":", cashier],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})

        if (customerName.length !== 0 || customerPhone.length !== 0) {
          receiptSettings?.cust_inf === "Y" &&
            (await BluetoothEscposPrinter.printColumn(
              columnWidthsHeader,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.CENTER,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              ["NAME", ":", customerName],
              {},
            ))
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText("------------------------", {
            align: "center",
          })

          await BluetoothEscposPrinter.printText("\n", {})
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        receiptSettings?.discount_flag === "Y" &&
          receiptSettings?.discount_position !== "B"
          ? await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ["ITEM", "QTY", "MRP", "DIS.", "TOT AMT"],
            {},
          )
          : await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBodyWithoutDiscount,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ["ITEM", "QTY", "MRP", "TOT AMT"],
            {},
          )
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        for (const item of addedProducts) {
          //@ts-ignore
          totalQuantities += parseInt(item?.quantity)

          const maxLen = 8; // For 2-inch
          const nameLines = wrapText(item.item_name, maxLen);

          for (let i = 0; i < nameLines.length; i++) {
            const currentItemName = nameLines[i] || "";

            if (i < nameLines.length - 1) {
              await BluetoothEscposPrinter.printColumn(
                columnWidthIfNameIsBig,
                [BluetoothEscposPrinter.ALIGN.LEFT],
                [receiptSettings?.print_op == '3' ? currentItemName : ''],
                {},
              );
              await BluetoothEscposPrinter.printText("\n", {});
            } else {
              receiptSettings?.discount_flag === "Y" &&
                receiptSettings?.discount_position !== "B"
                ? receiptSettings?.discount_type === "P"
                  ? await BluetoothEscposPrinter.printColumn(
                    columnWidthsProductsHeaderAndBody,
                    [
                      BluetoothEscposPrinter.ALIGN.LEFT,
                      BluetoothEscposPrinter.ALIGN.LEFT,
                      BluetoothEscposPrinter.ALIGN.CENTER,
                      BluetoothEscposPrinter.ALIGN.RIGHT,
                      BluetoothEscposPrinter.ALIGN.RIGHT,
                    ],
                    //@ts-ignore
                    [
                      receiptSettings?.print_op == '3' ? currentItemName : item?.item_name,
                      item?.quantity.toString(),
                      item?.price.toString(),
                      calculatePercentDiscountPerProduct(
                        item?.price,
                        item?.quantity,
                        item?.discount,
                      ),
                      calculateAmountAfterPercentDiscountPerProduct(
                        item?.price,
                        item?.quantity,
                        item?.discount,
                      ),
                    ],
                    {},
                  )
                  : await BluetoothEscposPrinter.printColumn(
                    columnWidthsProductsHeaderAndBody,
                    [
                      BluetoothEscposPrinter.ALIGN.LEFT,
                      BluetoothEscposPrinter.ALIGN.LEFT,
                      BluetoothEscposPrinter.ALIGN.CENTER,
                      BluetoothEscposPrinter.ALIGN.RIGHT,
                      BluetoothEscposPrinter.ALIGN.RIGHT,
                    ],
                    //@ts-ignore
                    [
                      currentItemName,
                      item?.quantity.toString(),
                      item?.price.toString(),
                      calculateAmountDiscountPerProduct(
                        item?.quantity,
                        item?.discount,
                      ),
                      calculateAmountAfterAmountDiscountPerProduct(
                        item?.price,
                        item?.quantity,
                        item?.discount,
                      ),
                    ],
                    {},
                  )
                : await BluetoothEscposPrinter.printColumn(
                  columnWidthsProductsHeaderAndBodyWithoutDiscount,
                  [
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                  ],
                  //@ts-ignore
                  [
                    currentItemName,
                    item?.quantity.toString(),
                    item?.price.toString(),
                    calculateAmountAfterAmountDiscountPerProduct(
                      item?.price,
                      item?.quantity,
                      0,
                    ),
                  ],
                  {},
                )
              await BluetoothEscposPrinter.printText("\n", {});
            }
          }
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printColumn(
          columnWidthsItemTotal,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            `ITEM: ${addedProducts?.length?.toString()} QTY: ${totalQuantities.toString()}`,
            `AMT: ${netTotal?.toFixed(2)}`,
          ],
          {},
        )

        receiptSettings?.discount_flag === "Y" &&
          (await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            //@ts-ignore
            ["DISCOUNT", ":", parseFloat(totalDiscountAmount).toFixed(2)],
            {},
          ))
        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["TOTAL", ":", netTotalCalculate(netTotal, totalDiscountAmount)],
          {},
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            "ROUND OFF",
            ":",
            `${roundingOffCalculate(netTotal, totalDiscountAmount)}`,
          ],
          {},
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            "NET AMT",
            ":",
            `${grandTotalCalculate(netTotal, totalDiscountAmount)}`,
          ],
          {},
        )

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})
        if (receiptSettings?.rcv_cash_flag === "Y") {
          if (paymentMode === "C") {
            await BluetoothEscposPrinter.printText("PAYMENT MODE", {
              align: "center",
            })
            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printText(
              `CASH RECEIVED:       ${cashAmount}`,
              { align: "center" },
            )
            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printText(
              `RETURNED AMT:        ${returnedAmt}`,
              { align: "center" },
            )

            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printerAlign(
              BluetoothEscposPrinter.ALIGN.CENTER,
            )

            await BluetoothEscposPrinter.printText("------------------------", {
              align: "center",
            })
            await BluetoothEscposPrinter.printText("\n", {})
          }
        } else {
          await BluetoothEscposPrinter.printText(
            `TOTAL RETURNED AMT:        ${Math.abs(returnedAmt)}`,
            { align: "center" },
          )

          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText("------------------------", {
            align: "center",
          })
          await BluetoothEscposPrinter.printText("\n", {})
        }

        if (paymentMode === "R") {
          await BluetoothEscposPrinter.printText("PAYMENT MODE", {
            align: "center",
          })
          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printText(
            `CASH RECEIVED:       ${cashAmount}`,
            { align: "center" },
          )
          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printText(
            `DUE AMT:        ${Math.abs(returnedAmt)}`,
            { align: "center" },
          )

          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText("------------------------", {
            align: "center",
          })
          await BluetoothEscposPrinter.printText("\n", {})
        }

        if (paymentMode === "D") {
          await BluetoothEscposPrinter.printText(
            `RECEIVED:       ${grandTotalCalculate(
              netTotal,
              totalDiscountAmount,
            )} [CARD]`,
            { align: "center" },
          )
          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText("------------------------", {
            align: "center",
          })
          await BluetoothEscposPrinter.printText("\n", {})
        }

        if (paymentMode === "U") {
          await BluetoothEscposPrinter.printText(
            `RECEIVED:       ${grandTotalCalculate(
              netTotal,
              totalDiscountAmount,
            )} [UPI]`,
            { align: "center" },
          )
          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText("------------------------", {
            align: "center",
          })

          if (upiData?.length > 0) {
            BluetoothEscposPrinter.printQRCode(
              `${upiData}&am=${grandTotalCalculate(
                netTotal,
                totalDiscountAmount,
              )}`,
              250,
              BluetoothEscposPrinter.ERROR_CORRECTION.L,
            )
          }
          await BluetoothEscposPrinter.printText("\n", {})
        }

        if (receiptSettings?.on_off_flag3 === "Y") {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
          await BluetoothEscposPrinter.printText("\n", {})
        }
        if (receiptSettings?.on_off_flag4 === "Y") {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
        }
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText("------X------", {})
        await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
      }
    } catch (e) {
      console.log(e.message || "ERROR")
    }
  }

  async function rePrintWithoutGst(
    addedProducts: ShowBillData[],
    netTotal: number,
    totalDiscountAmount: number,
    cashAmount?: number,
    returnedAmt?: number,
    customerName?: string,
    customerPhone?: string,
    rcptNo?: number,
    paymentMode?: string,
    isRefunded?: boolean,
    isRefundedDuplicate?: boolean,
    cancelFlag?: boolean,
  ) {
    const loginStore = JSON.parse(loginStorage.getString("login-data"))
    const fileStore = fileStorage.getString("comp_picture")
    console.log(fileStore, '4749===================================print without gst')
    const shopName: string = loginStore?.company_name?.toString()
    const address: string = loginStore?.address?.toString()
    const location: string = loginStore?.branch_name?.toString()
    const shopMobile: string = loginStore?.phone_no?.toString()
    const shopEmail: string = loginStore?.email_id?.toString()
    const cashier: string = loginStore?.user_name?.toString()
    // console.log(BASE_URL_CATEGORY_IMG + fileStore)
    let totalQuantities: number = 0
    let totalAmountAfterDiscount: number = 0
    // urlToBase64("https://example.com/image.jpg")
    console.log('without gst')

    try {
      if (receiptSettings?.print_op === "3") {
        let columnWidths = [20, 1, 27]
        let columnWidthsHeader = [15, 1, 32]
        let columnWidthsProductsHeaderAndBody = [18, 4, 8, 8, 10]
        let columnWidthsProductsHeaderAndBodyWithoutDiscount = [24, 6, 9, 9]
        let columnWidthsItemTotal = [30, 18]
        let columnWidthIfNameIsBig = [48]
        const separator = "------------------------------------------------"

        if (fileStore?.length > 0) {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          const options = {
            width: 375, // Assuming 80mm paper
            left: 50,
          }

          // await BluetoothEscposPrinter.printPic(fileStore, options)

          const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
            ? fileStore.split("data:application/octet-stream;base64,")[1]

            : fileStore
          console.log(pureBase64, 'purbase64 er indicator dao!')
          await BluetoothEscposPrinter.printPic(pureBase64, options)
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
          align: "center",
          widthtimes: 1.2,
          heigthtimes: 2,
        })
        await BluetoothEscposPrinter.printText("\n", {})

        if (receiptSettings?.on_off_flag1 === "Y") {
          console.log("printing center")
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          await BluetoothEscposPrinter.printText(receiptSettings?.header1, {
            align: "center",
          })
          await BluetoothEscposPrinter.printText("\n", {})
        }

        if (receiptSettings?.on_off_flag2 === "Y") {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          await BluetoothEscposPrinter.printText(receiptSettings?.header2, {
            align: "center",
          })
        }
        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        if (!cancelFlag) {
          !isRefunded
            ? await BluetoothEscposPrinter.printText("DUPLICATE RECEIPT", {
              align: "center",
            })
            : !isRefundedDuplicate
              ? await BluetoothEscposPrinter.printText("REFUND RECEIPT", {
                align: "center",
              })
              : await BluetoothEscposPrinter.printText(
                "DUPLICATE REFUND RECEIPT",
                {
                  align: "center",
                },
              )
        }

        cancelFlag &&
          (await BluetoothEscposPrinter.printText("CANCELLED BILL", {
            align: "center",
          }))

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText(separator, {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeader,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["RCPT.NO", ":", rcptNo?.toString()],
          {},
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeader,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["DATE", ":", `${new Date().toLocaleString("en-GB")}`],
          {},
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeader,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["CASHIER", ":", cashier],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText(separator, {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})

        if (addedProducts[0]?.phone_no !== "0000000000") {
          await BluetoothEscposPrinter.printColumn(
            columnWidthsHeader,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ["NAME", ":", customerName],
            {},
          )
        }
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText(separator, {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        addedProducts[0]?.discount_flag === "Y" &&
          addedProducts[0]?.discount_position !== "B"
          ? await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ["ITEM", "QTY", "MRP", "DIS.", "TOT AMT"],
            {},
          )
          : await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBodyWithoutDiscount,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ["ITEM", "QTY", "MRP", "TOT AMT"],
            {},
          )
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText(separator, {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        for (const item of addedProducts) {
          //@ts-ignore
          totalQuantities += parseInt(item?.qty)
          let discountType: "P" | "A" = addedProducts[0]?.discount_type
          let discountFlag: "Y" | "N" = addedProducts[0]?.discount_flag
          let discountPosition: "B" | "I" =
            addedProducts[0]?.discount_position

          if (item?.item_name?.length >= 15) {
            await BluetoothEscposPrinter.printColumn(
              columnWidthIfNameIsBig,
              [BluetoothEscposPrinter.ALIGN.LEFT],
              [item?.item_name],
              {},
            )

            discountFlag === "Y" && discountPosition !== "B"
              ? discountType === "P"
                ? await BluetoothEscposPrinter.printColumn(
                  columnWidthsProductsHeaderAndBody,
                  [
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.CENTER,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                  ],
                  //@ts-ignore
                  [
                    "",
                    item?.qty.toString(),
                    item?.price.toString(),
                    calculatePercentDiscountPerProduct(
                      item?.price,
                      item?.qty,
                      item?.dis_pertg,
                    ),
                    calculateAmountAfterPercentDiscountPerProduct(
                      item?.price,
                      item?.qty,
                      item?.dis_pertg,
                    ),
                  ],
                  {},
                )
                : await BluetoothEscposPrinter.printColumn(
                  columnWidthsProductsHeaderAndBody,
                  [
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.CENTER,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                  ],
                  [
                    "",
                    item?.qty.toString(),
                    item?.price.toString(),
                    calculateAmountDiscountPerProduct(
                      item?.qty,
                      item?.discount_amt,
                    ),
                    calculateAmountAfterAmountDiscountPerProduct(
                      item?.price,
                      item?.qty,
                      item?.discount_amt,
                    ),
                  ],
                  {},
                )
              : await BluetoothEscposPrinter.printColumn(
                columnWidthsProductsHeaderAndBodyWithoutDiscount,
                [
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                ],
                [
                  "",
                  item?.qty.toString(),
                  item?.price.toString(),
                  calculateAmountAfterAmountDiscountPerProduct(
                    item?.price,
                    item?.qty,
                    0,
                  ),
                ],
                {},
              )
          } else {
            discountFlag === "Y" && discountPosition !== "B"
              ? discountType === "P"
                ? await BluetoothEscposPrinter.printColumn(
                  columnWidthsProductsHeaderAndBody,
                  [
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.CENTER,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                  ],
                  //@ts-ignore
                  [
                    item?.item_name,
                    item?.qty.toString(),
                    item?.price.toString(),
                    calculatePercentDiscountPerProduct(
                      item?.price,
                      item?.qty,
                      item?.dis_pertg,
                    ),
                    calculateAmountAfterPercentDiscountPerProduct(
                      item?.price,
                      item?.qty,
                      item?.dis_pertg,
                    ),
                  ],
                  {},
                )
                : await BluetoothEscposPrinter.printColumn(
                  columnWidthsProductsHeaderAndBody,
                  [
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.CENTER,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                  ],
                  //@ts-ignore
                  [
                    item?.item_name,
                    item?.qty.toString(),
                    item?.price.toString(),
                    calculateAmountDiscountPerProduct(
                      item?.qty,
                      item?.discount_amt,
                    ),
                    calculateAmountAfterAmountDiscountPerProduct(
                      item?.price,
                      item?.qty,
                      item?.discount_amt,
                    ),
                  ],
                  {},
                )
              : await BluetoothEscposPrinter.printColumn(
                columnWidthsProductsHeaderAndBodyWithoutDiscount,
                [
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                ],
                //@ts-ignore
                [
                  item?.item_name,
                  item?.qty.toString(),
                  item?.price.toString(),
                  calculateAmountAfterAmountDiscountPerProduct(
                    item?.price,
                    item?.qty,
                    0,
                  ),
                ],
                {},
              )
          }
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printText(separator, {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printColumn(
          columnWidthsItemTotal,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            `ITEM: ${addedProducts?.length?.toString()} QTY: ${totalQuantities.toString()}`,
            `AMT: ${netTotal?.toFixed(2)}`,
          ],
          {},
        )

        addedProducts[0]?.discount_flag === "Y" &&
          (await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            //@ts-ignore
            ["DISCOUNT", ":", parseFloat(totalDiscountAmount).toFixed(2)],
            {},
          ))
        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["TOTAL", ":", `${netTotalCalculate(netTotal, totalDiscountAmount)}`],
          {},
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            "ROUND OFF",
            ":",
            `${roundingOffCalculate(netTotal, totalDiscountAmount)}`,
          ],
          {},
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            "NET AMT",
            ":",
            `${grandTotalCalculate(netTotal, totalDiscountAmount)}`,
          ],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText(separator, {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})

        if (!cancelFlag) {
          if (addedProducts[0]?.rcv_cash_flag === "Y") {
            if (!isRefunded && paymentMode === "C") {
              await BluetoothEscposPrinter.printText("PAYMENT MODE", {
                align: "center",
              })
              await BluetoothEscposPrinter.printText("\n", {})
              await BluetoothEscposPrinter.printText(
                `CASH RECEIVED:       ${cashAmount}`,
                { align: "center" },
              )
              await BluetoothEscposPrinter.printText("\n", {})
              await BluetoothEscposPrinter.printText(
                `RETURNED AMT:        ${returnedAmt}`,
                { align: "center" },
              )
              await BluetoothEscposPrinter.printText("\n", {})
              await BluetoothEscposPrinter.printerAlign(
                BluetoothEscposPrinter.ALIGN.CENTER,
              )

              await BluetoothEscposPrinter.printText(separator, {
                align: "center",
              })
              await BluetoothEscposPrinter.printText("\n", {})
            }
          } else {
            await BluetoothEscposPrinter.printText(
              `TOTAL RETURNED AMT:        ${Math.abs(returnedAmt)}`,
              { align: "center" },
            )
            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printerAlign(
              BluetoothEscposPrinter.ALIGN.CENTER,
            )

            await BluetoothEscposPrinter.printText(separator, {
              align: "center",
            })
            await BluetoothEscposPrinter.printText("\n", {})
          }
        }

        if (!cancelFlag) {
          if (paymentMode === "U") {
            await BluetoothEscposPrinter.printText(
              `RECEIVED:       ${grandTotalCalculate(
                netTotal,
                totalDiscountAmount,
              )} [UPI]`,
              { align: "center" },
            )
            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printerAlign(
              BluetoothEscposPrinter.ALIGN.CENTER,
            )

            await BluetoothEscposPrinter.printText(separator, {
              align: "center",
            })
            await BluetoothEscposPrinter.printText("\n", {})
          }
          if (paymentMode === "D") {
            await BluetoothEscposPrinter.printText(
              `RECEIVED:       ${grandTotalCalculate(
                netTotal,
                totalDiscountAmount,
              )} [CARD]`,
              { align: "center" },
            )
            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printerAlign(
              BluetoothEscposPrinter.ALIGN.CENTER,
            )
            await BluetoothEscposPrinter.printText(separator, {
              align: "center",
            })
            await BluetoothEscposPrinter.printText("\n", {})
          }
          if (paymentMode === "R") {
            await BluetoothEscposPrinter.printText("PAYMENT MODE", {
              align: "center",
            })
            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printText(
              `CASH RECEIVED:       ${cashAmount}`,
              { align: "center" },
            )
            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printText(
              `DUE AMT:        ${Math.abs(returnedAmt)}`,
              { align: "center" },
            )

            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printerAlign(
              BluetoothEscposPrinter.ALIGN.CENTER,
            )

            await BluetoothEscposPrinter.printText(separator, {
              align: "center",
            })
            await BluetoothEscposPrinter.printText("\n", {})
          }
        }

        if (isRefunded)
          await BluetoothEscposPrinter.printText(
            `REFUNDED AMT:    ${grandTotalCalculate(
              netTotal,
              totalDiscountAmount,
            )}`,
            { align: "center" },
          )

        if (receiptSettings?.on_off_flag3 === "Y") {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
          await BluetoothEscposPrinter.printText("\n", {})
        }
        if (receiptSettings?.on_off_flag4 === "Y") {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
          await BluetoothEscposPrinter.printText("\n", {})
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printText("------X------", {})
        await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
      } else {
        // existing code for 2-inch printer
        let columnWidths = [11, 1, 18]
        let columnWidthsHeader = [8, 1, 21]
        let columnWidthsProductsHeaderAndBody = [8, 4, 6, 5, 7]
        let columnWidthsProductsHeaderAndBodyWithoutDiscount = [8, 6, 7, 8]
        let columnWidthsItemTotal = [18, 12]
        let columnWidthIfNameIsBig = [32]

        if (fileStore?.length > 0) {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          const options = {
            width: 250,
            left: 50,
          }
          const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
            ? fileStore.split("data:application/octet-stream;base64,")[1]
            : fileStore
          console.log(pureBase64, 'purbase64 er indicator dao!')
          if (receiptSettings?.logo_flag == 'Y')
            await BluetoothEscposPrinter.printPic(pureBase64, options)
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
          align: "center",
          widthtimes: 1.2,
          heigthtimes: 2,
        })
        await BluetoothEscposPrinter.printText("\n", {})

        if (receiptSettings?.on_off_flag1 === "Y") {
          console.log("printing center")
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          await BluetoothEscposPrinter.printText(receiptSettings?.header1, {
            align: "center",
          })
          await BluetoothEscposPrinter.printText("\n", {})
        }

        if (receiptSettings?.on_off_flag2 === "Y") {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          await BluetoothEscposPrinter.printText(receiptSettings?.header2, {
            align: "center",
          })
        }
        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        if (!cancelFlag) {
          !isRefunded
            ? await BluetoothEscposPrinter.printText("DUPLICATE RECEIPT", {
              align: "center",
            })
            : !isRefundedDuplicate
              ? await BluetoothEscposPrinter.printText("REFUND RECEIPT", {
                align: "center",
              })
              : await BluetoothEscposPrinter.printText(
                "DUPLICATE REFUND RECEIPT",
                {
                  align: "center",
                },
              )
        }

        cancelFlag &&
          (await BluetoothEscposPrinter.printText("CANCELLED BILL", {
            align: "center",
          }))

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeader,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["RCPT.NO", ":", rcptNo?.toString()],
          {},
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeader,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["DATE", ":", `${new Date().toLocaleString("en-GB")}`],
          {},
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeader,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["CASHIER", ":", cashier],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})

        if (addedProducts[0]?.phone_no !== "0000000000") {
          await BluetoothEscposPrinter.printColumn(
            columnWidthsHeader,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ["NAME", ":", customerName],
            {},
          )
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        addedProducts[0]?.discount_flag === "Y" &&
          addedProducts[0]?.discount_position !== "B"
          ? await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ["ITEM", "QTY", "MRP", "DIS.", "TOT AMT"],
            {},
          )
          : await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBodyWithoutDiscount,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ["ITEM", "QTY", "MRP", "TOT AMT"],
            {},
          )
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        for (const item of addedProducts) {
          //@ts-ignore
          totalQuantities += parseInt(item?.qty)
          let discountType: "P" | "A" = addedProducts[0]?.discount_type
          let discountFlag: "Y" | "N" = addedProducts[0]?.discount_flag
          let discountPosition: "B" | "I" =
            addedProducts[0]?.discount_position

          if (item?.item_name?.length >= 8) {
            await BluetoothEscposPrinter.printColumn(
              columnWidthIfNameIsBig,
              [BluetoothEscposPrinter.ALIGN.LEFT],
              [item?.item_name],
              {},
            )

            discountFlag === "Y" && discountPosition !== "B"
              ? discountType === "P"
                ? await BluetoothEscposPrinter.printColumn(
                  columnWidthsProductsHeaderAndBody,
                  [
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.CENTER,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                  ],
                  //@ts-ignore
                  [
                    "",
                    item?.qty.toString(),
                    item?.price.toString(),
                    calculatePercentDiscountPerProduct(
                      item?.price,
                      item?.qty,
                      item?.dis_pertg,
                    ),
                    calculateAmountAfterPercentDiscountPerProduct(
                      item?.price,
                      item?.qty,
                      item?.dis_pertg,
                    ),
                  ],
                  {},
                )
                : await BluetoothEscposPrinter.printColumn(
                  columnWidthsProductsHeaderAndBody,
                  [
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.CENTER,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                  ],
                  [
                    "",
                    item?.qty.toString(),
                    item?.price.toString(),
                    calculateAmountDiscountPerProduct(
                      item?.qty,
                      item?.discount_amt,
                    ),
                    calculateAmountAfterAmountDiscountPerProduct(
                      item?.price,
                      item?.qty,
                      item?.discount_amt,
                    ),
                  ],
                  {},
                )
              : await BluetoothEscposPrinter.printColumn(
                columnWidthsProductsHeaderAndBodyWithoutDiscount,
                [
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                ],
                [
                  "",
                  item?.qty.toString(),
                  item?.price.toString(),
                  calculateAmountAfterAmountDiscountPerProduct(
                    item?.price,
                    item?.qty,
                    0,
                  ),
                ],
                {},
              )
          } else {
            discountFlag === "Y" && discountPosition !== "B"
              ? discountType === "P"
                ? await BluetoothEscposPrinter.printColumn(
                  columnWidthsProductsHeaderAndBody,
                  [
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.CENTER,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                  ],
                  //@ts-ignore
                  [
                    item?.item_name,
                    item?.qty.toString(),
                    item?.price.toString(),
                    calculatePercentDiscountPerProduct(
                      item?.price,
                      item?.qty,
                      item?.dis_pertg,
                    ),
                    calculateAmountAfterPercentDiscountPerProduct(
                      item?.price,
                      item?.qty,
                      item?.dis_pertg,
                    ),
                  ],
                  {},
                )
                : await BluetoothEscposPrinter.printColumn(
                  columnWidthsProductsHeaderAndBody,
                  [
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.CENTER,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                  ],
                  //@ts-ignore
                  [
                    item?.item_name,
                    item?.qty.toString(),
                    item?.price.toString(),
                    calculateAmountDiscountPerProduct(
                      item?.qty,
                      item?.discount_amt,
                    ),
                    calculateAmountAfterAmountDiscountPerProduct(
                      item?.price,
                      item?.qty,
                      item?.discount_amt,
                    ),
                  ],
                  {},
                )
              : await BluetoothEscposPrinter.printColumn(
                columnWidthsProductsHeaderAndBodyWithoutDiscount,
                [
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                ],
                //@ts-ignore
                [
                  item?.item_name,
                  item?.qty.toString(),
                  item?.price.toString(),
                  calculateAmountAfterAmountDiscountPerProduct(
                    item?.price,
                    item?.qty,
                    0,
                  ),
                ],
                {},
              )
          }
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printColumn(
          columnWidthsItemTotal,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            `ITEM: ${addedProducts?.length?.toString()} QTY: ${totalQuantities.toString()}`,
            `AMT: ${netTotal?.toFixed(2)}`,
          ],
          {},
        )

        addedProducts[0]?.discount_flag === "Y" &&
          (await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            //@ts-ignore
            ["DISCOUNT", ":", parseFloat(totalDiscountAmount).toFixed(2)],
            {},
          ))
        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["TOTAL", ":", `${netTotalCalculate(netTotal, totalDiscountAmount)}`],
          {},
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            "ROUND OFF",
            ":",
            `${roundingOffCalculate(netTotal, totalDiscountAmount)}`,
          ],
          {},
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            "NET AMT",
            ":",
            `${grandTotalCalculate(netTotal, totalDiscountAmount)}`,
          ],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})

        if (!cancelFlag) {
          if (addedProducts[0]?.rcv_cash_flag === "Y") {
            if (!isRefunded && paymentMode === "C") {
              await BluetoothEscposPrinter.printText("PAYMENT MODE", {
                align: "center",
              })
              await BluetoothEscposPrinter.printText("\n", {})
              await BluetoothEscposPrinter.printText(
                `CASH RECEIVED:       ${cashAmount}`,
                { align: "center" },
              )
              await BluetoothEscposPrinter.printText("\n", {})
              await BluetoothEscposPrinter.printText(
                `RETURNED AMT:        ${returnedAmt}`,
                { align: "center" },
              )

              await BluetoothEscposPrinter.printText("\n", {})
              await BluetoothEscposPrinter.printerAlign(
                BluetoothEscposPrinter.ALIGN.CENTER,
              )

              await BluetoothEscposPrinter.printText(
                "------------------------",
                {
                  align: "center",
                },
              )
              await BluetoothEscposPrinter.printText("\n", {})
            }
          } else {
            await BluetoothEscposPrinter.printText(
              `TOTAL RETURNED AMT:        ${Math.abs(returnedAmt)}`,
              { align: "center" },
            )

            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printerAlign(
              BluetoothEscposPrinter.ALIGN.CENTER,
            )

            await BluetoothEscposPrinter.printText("------------------------", {
              align: "center",
            })
            await BluetoothEscposPrinter.printText("\n", {})
          }
        }

        if (!cancelFlag) {
          if (paymentMode === "U") {
            await BluetoothEscposPrinter.printText(
              `RECEIVED:       ${grandTotalCalculate(
                netTotal,
                totalDiscountAmount,
              )} [UPI]`,
              { align: "center" },
            )
            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printerAlign(
              BluetoothEscposPrinter.ALIGN.CENTER,
            )

            await BluetoothEscposPrinter.printText("------------------------", {
              align: "center",
            })
            await BluetoothEscposPrinter.printText("\n", {})
          }
          if (paymentMode === "D") {
            await BluetoothEscposPrinter.printText(
              `RECEIVED:       ${grandTotalCalculate(
                netTotal,
                totalDiscountAmount,
              )} [CARD]`,
              { align: "center" },
            )
            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printerAlign(
              BluetoothEscposPrinter.ALIGN.CENTER,
            )

            await BluetoothEscposPrinter.printText("------------------------", {
              align: "center",
            })
            await BluetoothEscposPrinter.printText("\n", {})
          }
          if (paymentMode === "R") {
            await BluetoothEscposPrinter.printText("PAYMENT MODE", {
              align: "center",
            })
            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printText(
              `CASH RECEIVED:       ${cashAmount}`,
              { align: "center" },
            )
            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printText(
              `DUE AMT:        ${Math.abs(returnedAmt)}`,
              { align: "center" },
            )

            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printerAlign(
              BluetoothEscposPrinter.ALIGN.CENTER,
            )

            await BluetoothEscposPrinter.printText("------------------------", {
              align: "center",
            })
            await BluetoothEscposPrinter.printText("\n", {})
          }
        }

        if (isRefunded)
          await BluetoothEscposPrinter.printText(
            `REFUNDED AMT:    ${grandTotalCalculate(
              netTotal,
              totalDiscountAmount,
            )}`,
            { align: "center" },
          )

        if (receiptSettings?.on_off_flag3 === "Y") {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
          await BluetoothEscposPrinter.printText("\n", {})
        }
        if (receiptSettings?.on_off_flag4 === "Y") {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )

          await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
          await BluetoothEscposPrinter.printText("\n", {})
        }
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printText("------X------", {})
        await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
      }
    } catch (e) {
      console.log(e.message || "ERROR")
    }
  }
  async function rePrint2(
    addedProducts: ShowBillData[],
    netTotal: number,
    totalDiscountAmount: number,
    cashAmount?: number,
    returnedAmt?: number,
    customerName?: string,
    customerPhone?: string,
    rcptNo?: number,
    paymentMode?: string,
    isRefunded?: boolean,
    isRefundedDuplicate?: boolean,
    cancelFlag?: boolean,
  ) {
    console.log("CALLED rePrint")

    const loginStore = JSON.parse(loginStorage.getString("login-data"))
    const fileStore = fileStorage.getString("comp_picture")

    const shopName: string = loginStore?.company_name?.toString()
    const cashier: string = loginStore?.user_name?.toString()

    let gstTotals = gstFilterationAndTotalForRePrint(
      addedProducts,
      addedProducts[0]?.gst_type,
    )
    let { totalGST } = gstTotals
    const gstKeys = Object.keys(gstTotals).filter(key =>
      key.includes("totalCGST") || key.includes("totalSGST"),
    )

    let totalQuantities = 0

    // wrapText helper
    function wrapText(text: string, maxLen: number) {
      const lines: string[] = []
      let current = text

      while (current.length > maxLen) {
        let idx = current.lastIndexOf(" ", maxLen)
        if (idx <= 0) idx = maxLen
        lines.push(current.slice(0, idx))
        current = current.slice(idx).trim()
      }
      if (current.length > 0) lines.push(current)
      return lines
    }

    try {
      if (receiptSettings?.print_op === "3") {
        let columnWidthsProductsHeaderAndBody = [
          18, 4, 8, 8, 10,
        ]
        let columnWidthsProductsHeaderAndBodyWithoutDiscount = [
          24, 6, 9, 9,
        ]
        let columnWidthIfNameIsBig = [48]

        // ——— your header and logo printing code unchanged ——— //

        // Print table header
        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printColumn(
          receiptSettings?.discount_flag === "Y" &&
            receiptSettings?.discount_position !== "B"
            ? columnWidthsProductsHeaderAndBody
            : columnWidthsProductsHeaderAndBodyWithoutDiscount,
          receiptSettings?.discount_flag === "Y" &&
            receiptSettings?.discount_position !== "B"
            ? [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ]
            : [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
          receiptSettings?.discount_flag === "Y" &&
            receiptSettings?.discount_position !== "B"
            ? ["ITEM", "QTY", "MRP", "DIS.", "TOT AMT"]
            : ["ITEM", "QTY", "MRP", "TOT AMT"],
          {},
        )

        await BluetoothEscposPrinter.printText("\n", {})

        // ——— NEW WRAPPED ITEM PRINTING CODE ——— //
        for (const item of addedProducts) {
          totalQuantities += +item?.qty

          // determine max length for wrap
          const maxLen =
            receiptSettings?.discount_flag === "Y" &&
              receiptSettings?.discount_position !== "B"
              ? 18
              : 24

          const nameLines = wrapText(item.item_name, maxLen)
          const lastLine = nameLines.pop() || ""

          // print wrapped preceding lines
          for (const line of nameLines) {
            await BluetoothEscposPrinter.printColumn(
              columnWidthIfNameIsBig,
              [BluetoothEscposPrinter.ALIGN.LEFT],
              [line],
              {},
            )
          }

          // now print the last line with all columns
          if (
            receiptSettings?.discount_flag === "Y" &&
            receiptSettings?.discount_position !== "B"
          ) {
            if (receiptSettings?.discount_type === "P") {
              await BluetoothEscposPrinter.printColumn(
                columnWidthsProductsHeaderAndBody,
                [
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.CENTER,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                ],
                [
                  lastLine,
                  item.qty.toString(),
                  item.price.toString(),
                  calculatePercentDiscountPerProduct(
                    item.price,
                    item.qty,
                    item.dis_pertg,
                  ),
                  calculateAmountAfterPercentDiscountPerProduct(
                    item.price,
                    item.qty,
                    item.dis_pertg,
                  ),
                ],
                {},
              )
            } else {
              await BluetoothEscposPrinter.printColumn(
                columnWidthsProductsHeaderAndBody,
                [
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.CENTER,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                ],
                [
                  lastLine,
                  item.qty.toString(),
                  item.price.toString(),
                  calculateAmountDiscountPerProduct(
                    item.qty,
                    item.discount_amt,
                  ),
                  calculateAmountAfterAmountDiscountPerProduct(
                    item.price,
                    item.qty,
                    item.discount_amt,
                  ),
                ],
                {},
              )
            }
          } else {
            await BluetoothEscposPrinter.printColumn(
              columnWidthsProductsHeaderAndBodyWithoutDiscount,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              [
                lastLine,
                item.qty.toString(),
                item.price.toString(),
                calculateAmountAfterAmountDiscountPerProduct(
                  item.price,
                  item.qty,
                  0,
                ),
              ],
              {},
            )
          }

          await BluetoothEscposPrinter.printText("\n", {})
        }
        // ——— end item printing ——— //

        // ——— the rest of your totals / GST / payment / footer logic stays the same ——— //

      } else {
        // similarly modify the 58mm (non-print_op === "3") portion
        // exactly the same pattern with wrapText + aligned last line

        let columnWidthsProductsHeaderAndBody = [
          8, 4, 6, 5, 7,
        ]
        let columnWidthsProductsHeaderAndBodyWithoutDiscount = [
          8, 6, 7, 8,
        ]
        let columnWidthIfNameIsBig = [32]

        // ——— wrap printing for items in 58mm receipts ——— //
        for (const item of addedProducts) {
          totalQuantities += +item?.qty

          const maxLen = 8
          const nameLines = wrapText(item.item_name, maxLen)
          const lastLine = nameLines.pop() || ""

          for (const line of nameLines) {
            await BluetoothEscposPrinter.printColumn(
              columnWidthIfNameIsBig,
              [BluetoothEscposPrinter.ALIGN.LEFT],
              [line],
              {},
            )
          }

          if (
            addedProducts[0]?.discount_flag === "Y" &&
            addedProducts[0]?.discount_position !== "B"
          ) {
            if (addedProducts[0]?.discount_type === "P") {
              await BluetoothEscposPrinter.printColumn(
                columnWidthsProductsHeaderAndBody,
                [
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.CENTER,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                ],
                [
                  lastLine,
                  item.qty.toString(),
                  item.price.toString(),
                  calculatePercentDiscountPerProduct(
                    item.price,
                    item.qty,
                    item.dis_pertg,
                  ),
                  calculateAmountAfterPercentDiscountPerProduct(
                    item.price,
                    item.qty,
                    item.dis_pertg,
                  ),
                ],
                {},
              )
            } else {
              await BluetoothEscposPrinter.printColumn(
                columnWidthsProductsHeaderAndBody,
                [
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.CENTER,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                ],
                [
                  lastLine,
                  item.qty.toString(),
                  item.price.toString(),
                  calculateAmountDiscountPerProduct(
                    item.qty,
                    item.discount_amt,
                  ),
                  calculateAmountAfterAmountDiscountPerProduct(
                    item.price,
                    item.qty,
                    item.discount_amt,
                  ),
                ],
                {},
              )
            }
          } else {
            await BluetoothEscposPrinter.printColumn(
              columnWidthsProductsHeaderAndBodyWithoutDiscount,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              [
                lastLine,
                item.qty.toString(),
                item.price.toString(),
                calculateAmountAfterAmountDiscountPerProduct(
                  item.price,
                  item.qty,
                  0,
                ),
              ],
              {},
            )
          }

          await BluetoothEscposPrinter.printText("\n", {})
        }

        // ——— totals / GST / payment / footer unchanged ——— //
      }
    } catch (e) {
      console.log(e.message || "ERROR")
    }
  }

  async function rePrintprintop(
    addedProducts: ShowBillData[],
    netTotal: number,
    totalDiscountAmount: number,
    cashAmount?: number,
    returnedAmt?: number,
    customerName?: string,
    customerPhone?: string,
    rcptNo?: number,
    paymentMode?: string,
    isRefunded?: boolean,
    isRefundedDuplicate?: boolean,
    cancelFlag?: boolean,
  ) {
    console.log(
      "SSSSSSSSSSSSSSSS==================SSSSSSSSSSSSSSSSSS CALLED rePrint",
    )

    const loginStore = JSON.parse(loginStorage.getString("login-data"))
    const fileStore = fileStorage.getString("comp_picture")

    const shopName: string = loginStore?.company_name?.toString()
    const address: string = loginStore?.address?.toString()
    const location: string = loginStore?.branch_name?.toString()
    const shopMobile: string = loginStore?.phone_no?.toString()
    const shopEmail: string = loginStore?.email_id?.toString()
    const cashier: string = loginStore?.user_name?.toString()
    function wrapText(text: string, maxLen: number) {
      const lines: string[] = [];
      let current = text;

      while (current.length > maxLen) {
        // find space to break on
        let idx = current.lastIndexOf(" ", maxLen);
        if (idx <= 0) idx = maxLen; // hard break if no space
        lines.push(current.slice(0, idx));
        current = current.slice(idx).trim();
      }

      if (current.length > 0) {
        lines.push(current);
      }

      return lines;
    }
    let gstTotals = gstFilterationAndTotalForRePrint(
      addedProducts,
      addedProducts[0]?.gst_type,
    )
    let { totalGST } = gstTotals

    const gstKeys = Object.keys(gstTotals).filter(
      key => key.includes("totalCGST") || key.includes("totalSGST"),
    )

    let totalQuantities: number = 0
    let totalAmountAfterDiscount: number = 0

    try {
      if (receiptSettings?.print_op === "3") {
        let columnWidths = [20, 1, 27]
        let columnWidthsHeader = [10, 1, 32]
        let columnWidthsProductsHeaderAndBody = [18, 4, 8, 8, 10]
        let columnWidthsProductsHeaderAndBodyWithoutDiscount = [24, 6, 9, 9]
        let columnWidthsItemTotal = [30, 18]
        let columnWidthIfNameIsBig = [48]
        const separator = "------------------------------------------------"

        if (fileStore?.length > 0) {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          const options = {
            width: 375, // Assuming 80mm paper
            left: 50,
          }
          const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
            ? fileStore.split("data:application/octet-stream;base64,")[1]

            : fileStore
          console.log(pureBase64, 'purbase64 er indicator dao reprint!')
          if (receiptSettings?.logo_flag == 'Y')
            await BluetoothEscposPrinter.printPic(pureBase64, options)
          // await BluetoothEscposPrinter.printPic(fileStore, options)
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
          align: "center",
          widthtimes: 1.2,
          heigthtimes: 2,
        })
        await BluetoothEscposPrinter.printText("\n", {})

        if (receiptSettings?.on_off_flag1 === "Y") {
          await BluetoothEscposPrinter.printText(receiptSettings?.header1, {
            align: "center",
          })
          await BluetoothEscposPrinter.printText("\n", {})
        }

        if (receiptSettings?.on_off_flag2 === "Y") {
          await BluetoothEscposPrinter.printText(receiptSettings?.header2, {
            align: "center",
          })
        }
        await BluetoothEscposPrinter.printText("\n", {})

        if (!cancelFlag) {
          !isRefunded
            ? await BluetoothEscposPrinter.printText("DUPLICATE RECEIPT", {
              align: "center",
            })
            : !isRefundedDuplicate
              ? await BluetoothEscposPrinter.printText("REFUND RECEIPT", {
                align: "center",
              })
              : await BluetoothEscposPrinter.printText(
                "DUPLICATE REFUND RECEIPT",
                {
                  align: "center",
                },
              )
        }

        cancelFlag &&
          (await BluetoothEscposPrinter.printText("CANCELLED BILL", {
            align: "center",
          }))

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(separator, {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeader,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["RCPT.NO", ":", rcptNo?.toString()],
          {},
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeader,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["DATE", ":", `${new Date().toLocaleString("en-GB")}`],
          {},
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeader,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["CASHIER", ":", cashier],
          {},
        )

        await BluetoothEscposPrinter.printText(separator, {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})

        if (customerName.length !== 0 || customerPhone.length !== 0) {
          receiptSettings?.cust_inf === "Y" &&
            (await BluetoothEscposPrinter.printColumn(
              columnWidthsHeader,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.CENTER,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              ["NAME", ":", customerName],
              {},
            ))
        }

        await BluetoothEscposPrinter.printText(separator, {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        addedProducts[0]?.discount_flag === "Y" &&
          addedProducts[0]?.discount_position !== "B"
          ? await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ["ITEM", "QTY", "MRP", "DIS.", "TOT AMT"],
            {},
          )
          : await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBodyWithoutDiscount,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ["ITEM", "QTY", "MRP", "TOT AMT"],
            {},
          )

        await BluetoothEscposPrinter.printText(separator, {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        for (const item of addedProducts) {
          //@ts-ignore
          totalQuantities += parseInt(item?.qty)
          let discountType: "P" | "A" = addedProducts[0]?.discount_type
          let discountFlag: "N" | "Y" = addedProducts[0]?.discount_flag
          let discountPosition: "B" | "I" =
            addedProducts[0]?.discount_position

          if (item?.item_name?.length >= 15) {
            const wrappedItemName = wrapText(item.item_name, 15)
            const firstLine = wrappedItemName.shift() || ""

            discountFlag === "Y" && discountPosition !== "B"
              ? discountType === "P"
                ? await BluetoothEscposPrinter.printColumn(
                  columnWidthsProductsHeaderAndBody,
                  [
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.CENTER,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                  ],
                  //@ts-ignore
                  [
                    receiptSettings?.print_op == '3' ? firstLine : 'item?.item_name',
                    item?.qty.toString(),
                    item?.price.toString(),
                    calculatePercentDiscountPerProduct(
                      item?.price,
                      item?.qty,
                      item?.dis_pertg,
                    ),
                    calculateAmountAfterPercentDiscountPerProduct(
                      item?.price,
                      item?.qty,
                      item?.dis_pertg,
                    ),
                  ],
                  {},
                )
                : await BluetoothEscposPrinter.printColumn(
                  columnWidthsProductsHeaderAndBody,
                  [
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.CENTER,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                  ],
                  //@ts-ignore
                  [
                    firstLine,
                    item?.qty.toString(),
                    item?.price.toString(),
                    calculateAmountDiscountPerProduct(
                      item?.qty,
                      item?.discount_amt,
                    ),
                    calculateAmountAfterAmountDiscountPerProduct(
                      item?.price,
                      item?.qty,
                      item?.discount_amt,
                    ),
                  ],
                  {},
                )
              : await BluetoothEscposPrinter.printColumn(
                columnWidthsProductsHeaderAndBodyWithoutDiscount,
                [
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                ],
                //@ts-ignore
                [
                  firstLine,
                  item?.qty.toString(),
                  item?.price.toString(),
                  calculateAmountAfterAmountDiscountPerProduct(
                    item?.price,
                    item?.qty,
                    0,
                  ),
                ],
                {},
              )

            for (const line of wrappedItemName) {
              await BluetoothEscposPrinter.printColumn(
                columnWidthIfNameIsBig,
                [BluetoothEscposPrinter.ALIGN.LEFT],
                [line],
                {},
              )
            }
          } else {
            discountFlag === "Y" && discountPosition !== "B"
              ? discountType === "P"
                ? await BluetoothEscposPrinter.printColumn(
                  columnWidthsProductsHeaderAndBody,
                  [
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.CENTER,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                  ],
                  //@ts-ignore
                  [
                    item?.item_name,
                    item?.qty.toString(),
                    item?.price.toString(),
                    calculatePercentDiscountPerProduct(
                      item?.price,
                      item?.qty,
                      item?.dis_pertg,
                    ),
                    calculateAmountAfterPercentDiscountPerProduct(
                      item?.price,
                      item?.qty,
                      item?.dis_pertg,
                    ),
                  ],
                  {},
                )
                : await BluetoothEscposPrinter.printColumn(
                  columnWidthsProductsHeaderAndBody,
                  [
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.CENTER,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                  ],
                  //@ts-ignore
                  [
                    item?.item_name,
                    item?.qty.toString(),
                    item?.price.toString(),
                    calculateAmountDiscountPerProduct(
                      item?.qty,
                      item?.discount_amt,
                    ),
                    calculateAmountAfterAmountDiscountPerProduct(
                      item?.price,
                      item?.qty,
                      item?.discount_amt,
                    ),
                  ],
                  {},
                )
              : await BluetoothEscposPrinter.printColumn(
                columnWidthsProductsHeaderAndBodyWithoutDiscount,
                [
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                ],
                //@ts-ignore
                [
                  item?.item_name,
                  item?.qty.toString(),
                  item?.price.toString(),
                  calculateAmountAfterAmountDiscountPerProduct(
                    item?.price,
                    item?.qty,
                    0,
                  ),
                ],
                {},
              )
          }
        }

        await BluetoothEscposPrinter.printText(separator, {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printColumn(
          columnWidthsItemTotal,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            `ITEM: ${addedProducts?.length?.toString()} QTY: ${totalQuantities.toString()}`,
            `AMT: ${netTotal?.toFixed(2)}`,
          ],
          {},
        )

        addedProducts[0]?.gst_flag === "Y" &&
          gstKeys.map(
            async key =>
              await BluetoothEscposPrinter.printColumn(
                columnWidths,
                [
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.CENTER,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                ],
                [
                  `${key.includes("CGST") ? "CGST" : "SGST"} @${key
                    .replace(/total(CGST|SGST)_/, "")
                    .replace("_", ".")}%`,
                  ":",
                  gstTotals[key].toFixed(2).toString(),
                ],
                {},
              ),
          )

        addedProducts[0]?.gst_flag === "Y" &&
          (await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ["TOTAL GST", ":", totalGST.toFixed(2).toString()],
            {},
          ))

        addedProducts[0]?.discount_flag === "Y" &&
          (await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            //@ts-ignore
            ["DISCOUNT", ":", parseFloat(totalDiscountAmount).toFixed(2)],
            {},
          ))

        addedProducts[0]?.gst_type === "E"
          ? await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              "TOTAL",
              ":",
              `${netTotalWithGSTCalculate(
                netTotal,
                totalDiscountAmount,
                totalGST,
              )}`,
            ],
            {},
          )
          : await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              "TOTAL",
              ":",
              `${netTotalWithGSTInclCalculate(netTotal, totalDiscountAmount)}`,
            ],
            {},
          )

        addedProducts[0]?.gst_type === "E"
          ? await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              "ROUND OFF",
              ":",
              `${roundingOffWithGSTCalculate(
                netTotal,
                totalDiscountAmount,
                totalGST,
              )}`,
            ],
            {},
          )
          : await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              "ROUND OFF",
              ":",
              `${roundingOffWithGSTInclCalculate(
                netTotal,
                totalDiscountAmount,
              )}`,
            ],
            {},
          )

        addedProducts[0]?.gst_type === "E"
          ? await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              "NET AMT",
              ":",
              `${grandTotalWithGSTCalculate(
                netTotal,
                totalDiscountAmount,
                totalGST,
              )}`,
            ],
            {},
          )
          : await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              "NET AMT",
              ":",
              `${grandTotalWithGSTInclCalculate(
                netTotal,
                totalDiscountAmount,
              )}`,
            ],
            {},
          )

        await BluetoothEscposPrinter.printText(separator, {
          align: "center",
        })
        !cancelFlag && (await BluetoothEscposPrinter.printText("\n", {}))

        if (!cancelFlag) {
          if (addedProducts[0]?.rcv_cash_flag === "Y") {
            if (!isRefunded && paymentMode === "C") {
              await BluetoothEscposPrinter.printText("PAYMENT MODE", {
                align: "center",
              })
              await BluetoothEscposPrinter.printText("\n", {})
              await BluetoothEscposPrinter.printText(
                `CASH RECEIVED:       ${cashAmount}`,
                { align: "center" },
              )
              await BluetoothEscposPrinter.printText("\n", {})
              await BluetoothEscposPrinter.printText(
                `RETURNED AMT:        ${returnedAmt}`,
                { align: "center" },
              )

              await BluetoothEscposPrinter.printText("\n", {})
              await BluetoothEscposPrinter.printText(separator, {
                align: "center",
              })
            }
          } else {
            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printText(
              `TOTAL RETURNED AMT:        ${Math.abs(returnedAmt)}`,
              { align: "center" },
            )

            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printText(separator, {
              align: "center",
            })
            await BluetoothEscposPrinter.printText("\n", {})
          }
        }

        if (!cancelFlag) {
          await BluetoothEscposPrinter.printText("\n", {})

          if (paymentMode === "R") {
            await BluetoothEscposPrinter.printText("PAYMENT MODE", {
              align: "center",
            })
            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printText(
              `CASH RECEIVED:       ${cashAmount}`,
              { align: "center" },
            )
            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printText(
              `DUE AMT:        ${Math.abs(returnedAmt)}`,
              { align: "center" },
            )

            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printText(separator, {
              align: "center",
            })
            await BluetoothEscposPrinter.printText("\n", {})
          }

          if (paymentMode === "D") {
            await BluetoothEscposPrinter.printText(
              `RECEIVED:       ${grandTotalCalculate(
                netTotal,
                totalDiscountAmount,
              )} [CARD]`,
              { align: "center" },
            )
            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printText(separator, {
              align: "center",
            })
            await BluetoothEscposPrinter.printText("\n", {})
          }

          if (paymentMode === "U") {
            receiptSettings?.gst_type === "E"
              ? await BluetoothEscposPrinter.printText(
                `RECEIVED:       ${grandTotalWithGSTCalculate(
                  netTotal,
                  totalDiscountAmount,
                  totalGST,
                )} [UPI]`,
                { align: "center" },
              )
              : await BluetoothEscposPrinter.printText(
                `RECEIVED:       ${grandTotalWithGSTInclCalculate(
                  netTotal,
                  totalDiscountAmount,
                )} [UPI]`,
                { align: "center" },
              )
            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printText(separator, {
              align: "center",
            })
          }
        }

        if (isRefunded)
          addedProducts[0]?.gst_type === "E"
            ? await BluetoothEscposPrinter.printText(
              `REFUNDED AMT:    ${grandTotalWithGSTCalculate(
                netTotal,
                totalDiscountAmount,
                totalGST,
              )}`,
              { align: "center" },
            )
            : await BluetoothEscposPrinter.printText(
              `REFUNDED AMT:    ${grandTotalWithGSTInclCalculate(
                netTotal,
                totalDiscountAmount,
              )}`,
              { align: "center" },
            )
        await BluetoothEscposPrinter.printText("\n", {})

        if (receiptSettings?.on_off_flag3 === "Y") {
          await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
          await BluetoothEscposPrinter.printText("\n", {})
        }
        if (receiptSettings?.on_off_flag4 === "Y") {
          await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
        }
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText("------X------", {})
        await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
      } else {
        let columnWidths = [11, 1, 18]
        let columnWidthsHeader = [8, 1, 21]
        let columnWidthsProductsHeaderAndBody = [8, 4, 6, 5, 7]
        let columnWidthsProductsHeaderAndBodyWithoutDiscount = [8, 6, 7, 8]
        // let columnWidthsProductsHeaderAndBody = [18, 3, 4, 3, 4]
        let columnWidthsItemTotal = [18, 12]
        let columnWidthIfNameIsBig = [32]

        // let newColumnWidths: number[] = [9, 9, 6, 7]

        if (fileStore?.length > 0) {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          const options = {
            width: 210, // Assuming 58mm paper width with 8 dots/mm resolution (58mm * 8dots/mm = 384 dots)
            left: 50, // No left padding
            // align: "CENTER"
          }

          // Print the image
          const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
            ? fileStore.split("data:application/octet-stream;base64,")[1]

            : fileStore
          console.log(pureBase64, 'purbase64 er indicator dao reprint!')
          if (receiptSettings?.logo_flag == 'Y')
            await BluetoothEscposPrinter.printPic(pureBase64, options)
          // await BluetoothEscposPrinter.printPic(fileStore, options)
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
          align: "center",
          widthtimes: 1.2,
          heigthtimes: 2,
        })
        await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText("hasifughaf", { align: "center" })

        if (receiptSettings?.on_off_flag1 === "Y") {
          await BluetoothEscposPrinter.printText(receiptSettings?.header1, {
            align: "center",
          })
          await BluetoothEscposPrinter.printText("\n", {})
        }

        if (receiptSettings?.on_off_flag2 === "Y") {
          await BluetoothEscposPrinter.printText(receiptSettings?.header2, {
            align: "center",
          })
        }
        await BluetoothEscposPrinter.printText("\n", {})

        if (!cancelFlag) {
          !isRefunded
            ? await BluetoothEscposPrinter.printText("DUPLICATE RECEIPT", {
              align: "center",
            })
            : !isRefundedDuplicate
              ? await BluetoothEscposPrinter.printText("REFUND RECEIPT", {
                align: "center",
              })
              : await BluetoothEscposPrinter.printText(
                "DUPLICATE REFUND RECEIPT",
                {
                  align: "center",
                },
              )
        }

        cancelFlag &&
          (await BluetoothEscposPrinter.printText("CANCELLED BILL", {
            align: "center",
          }))

        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText("------------------------", {
        //   align: "center",
        // })

        // await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText(address, {
        //   align: "center",
        // })
        // await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText(location, {
        //   align: "center",
        // })
        await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText("------------------------", {
        //   align: "center",
        // })
        // await BluetoothEscposPrinter.printText("\n", {})

        // // await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT)

        // await BluetoothEscposPrinter.printColumn(
        //   columnWidthsHeader,
        //   [
        //     BluetoothEscposPrinter.ALIGN.LEFT,
        //     BluetoothEscposPrinter.ALIGN.CENTER,
        //     BluetoothEscposPrinter.ALIGN.RIGHT,
        //   ],
        //   ["MOBILE", ":", shopMobile],
        //   {},
        // )
        // await BluetoothEscposPrinter.printColumn(
        //   columnWidthsHeader,
        //   [
        //     BluetoothEscposPrinter.ALIGN.LEFT,
        //     BluetoothEscposPrinter.ALIGN.CENTER,
        //     BluetoothEscposPrinter.ALIGN.RIGHT,
        //   ],
        //   ["EMAIL", ":", shopEmail],
        //   {},
        // )
        // await BluetoothEscposPrinter.printColumn(
        //     columnWidthsHeader,
        //     [
        //         BluetoothEscposPrinter.ALIGN.LEFT,
        //         BluetoothEscposPrinter.ALIGN.CENTER,
        //         BluetoothEscposPrinter.ALIGN.RIGHT,
        //     ],
        //     ["SITE", ":", "SHOPNAME.COM"],
        //     {},
        // )

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeader,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["RCPT.NO", ":", rcptNo?.toString()],
          {},
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeader,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["DATE", ":", `${new Date().toLocaleString("en-GB")}`],
          {},
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeader,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["CASHIER", ":", cashier],
          {},
        )

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})

        if (customerName.length !== 0 || customerPhone.length !== 0) {
          receiptSettings?.cust_inf === "Y" &&
            (await BluetoothEscposPrinter.printColumn(
              columnWidthsHeader,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.CENTER,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              ["NAME", ":", customerName],
              {},
            ))
          // await BluetoothEscposPrinter.printColumn(
          //   columnWidthsHeader,
          //   [
          //     BluetoothEscposPrinter.ALIGN.LEFT,
          //     BluetoothEscposPrinter.ALIGN.CENTER,
          //     BluetoothEscposPrinter.ALIGN.RIGHT,
          //   ],
          //   ["PHONE", ":", customerPhone],
          //   {},
          // )
        }

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        addedProducts[0]?.discount_flag === "Y" &&
          addedProducts[0]?.discount_position !== "B"
          ? await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ["ITEM", "QTY", "MRP", "DIS.", "TOT AMT"],
            {},
          )
          : await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBodyWithoutDiscount,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ["ITEM", "QTY", "MRP", "TOT AMT"],
            {},
          )

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        for (const item of addedProducts) {
          //@ts-ignore
          totalQuantities += parseInt(item?.qty)
          let discountType: "P" | "A" = addedProducts[0]?.discount_type
          let discountFlag: "N" | "Y" = addedProducts[0]?.discount_flag
          let discountPosition: "B" | "I" =
            addedProducts[0]?.discount_position

          if (item?.item_name?.length >= 8) {
            const wrappedItemName = wrapText(item.item_name, 8)
            const firstLine = wrappedItemName.shift() || ""

            discountFlag === "Y" && discountPosition !== "B"
              ? discountType === "P"
                ? await BluetoothEscposPrinter.printColumn(
                  columnWidthsProductsHeaderAndBody,
                  [
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.CENTER,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                  ],
                  //@ts-ignore
                  [
                    firstLine,
                    item?.qty.toString(),
                    item?.price.toString(),
                    calculatePercentDiscountPerProduct(
                      item?.price,
                      item?.qty,
                      item?.dis_pertg,
                    ),
                    calculateAmountAfterPercentDiscountPerProduct(
                      item?.price,
                      item?.qty,
                      item?.dis_pertg,
                    ),
                  ],
                  {},
                )
                : await BluetoothEscposPrinter.printColumn(
                  columnWidthsProductsHeaderAndBody,
                  [
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.CENTER,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                  ],
                  //@ts-ignore
                  [
                    firstLine,
                    item?.qty.toString(),
                    item?.price.toString(),
                    calculateAmountDiscountPerProduct(
                      item?.qty,
                      item?.discount_amt,
                    ),
                    calculateAmountAfterAmountDiscountPerProduct(
                      item?.price,
                      item?.qty,
                      item?.discount_amt,
                    ),
                  ],
                  {},
                )
              : await BluetoothEscposPrinter.printColumn(
                columnWidthsProductsHeaderAndBodyWithoutDiscount,
                [
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                ],
                //@ts-ignore
                [
                  firstLine,
                  item?.qty.toString(),
                  item?.price.toString(),
                  calculateAmountAfterAmountDiscountPerProduct(
                    item?.price,
                    item?.qty,
                    0,
                  ),
                ],
                {},
              )

            for (const line of wrappedItemName) {
              await BluetoothEscposPrinter.printColumn(
                columnWidthIfNameIsBig,
                [BluetoothEscposPrinter.ALIGN.LEFT],
                [line],
                {},
              )
            }
          } else {
            discountFlag === "Y" && discountPosition !== "B"
              ? discountType === "P"
                ? await BluetoothEscposPrinter.printColumn(
                  columnWidthsProductsHeaderAndBody,
                  [
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.CENTER,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                  ],
                  //@ts-ignore
                  [
                    item?.item_name,
                    item?.qty.toString(),
                    item?.price.toString(),
                    calculatePercentDiscountPerProduct(
                      item?.price,
                      item?.qty,
                      item?.dis_pertg,
                    ),
                    calculateAmountAfterPercentDiscountPerProduct(
                      item?.price,
                      item?.qty,
                      item?.dis_pertg,
                    ),
                  ],
                  {},
                )
                : await BluetoothEscposPrinter.printColumn(
                  columnWidthsProductsHeaderAndBody,
                  [
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.LEFT,
                    BluetoothEscposPrinter.ALIGN.CENTER,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                    BluetoothEscposPrinter.ALIGN.RIGHT,
                  ],
                  //@ts-ignore
                  [
                    item?.item_name,
                    item?.qty.toString(),
                    item?.price.toString(),
                    calculateAmountDiscountPerProduct(
                      item?.qty,
                      item?.discount_amt,
                    ),
                    calculateAmountAfterAmountDiscountPerProduct(
                      item?.price,
                      item?.qty,
                      item?.discount_amt,
                    ),
                  ],
                  {},
                )
              : await BluetoothEscposPrinter.printColumn(
                columnWidthsProductsHeaderAndBodyWithoutDiscount,
                [
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                ],
                //@ts-ignore
                [
                  item?.item_name,
                  item?.qty.toString(),
                  item?.price.toString(),
                  calculateAmountAfterAmountDiscountPerProduct(
                    item?.price,
                    item?.qty,
                    0,
                  ),
                ],
                {},
              )
          }
        }

        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printColumn(
          columnWidthsItemTotal,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            `ITEM: ${addedProducts?.length?.toString()} QTY: ${totalQuantities.toString()}`,
            `AMT: ${netTotal?.toFixed(2)}`,
          ],
          {},
        )
        // await BluetoothEscposPrinter.printText("\n", {})

        // addedProducts[0]?.gst_type === "E"
        //     ? await BluetoothEscposPrinter.printColumn(
        //         columnWidths,
        //         [
        //             BluetoothEscposPrinter.ALIGN.LEFT,
        //             BluetoothEscposPrinter.ALIGN.CENTER,
        //             BluetoothEscposPrinter.ALIGN.RIGHT,
        //         ],
        //         // ["TOTAL", ":", `${(netTotal - totalDiscountAmount + totalGST).toFixed(2)}`],
        //         ["TOTAL", ":", `${netTotalWithGSTCalculate(netTotal, totalDiscountAmount, totalGST)}`],
        //         {},
        //     )
        //     : await BluetoothEscposPrinter.printColumn(
        //         columnWidths,
        //         [
        //             BluetoothEscposPrinter.ALIGN.LEFT,
        //             BluetoothEscposPrinter.ALIGN.CENTER,
        //             BluetoothEscposPrinter.ALIGN.RIGHT,
        //         ],
        //         // ["TOTAL", ":", `${(netTotal - totalDiscountAmount + totalGST).toFixed(2)}`],
        //         ["TOTAL", ":", `${totalAmountWithGSTInclCalculate(netTotal, totalGST)}`],
        //         {},
        //     )

        // addedProducts[0]?.gst_type === "I" &&
        //     await BluetoothEscposPrinter.printColumn(
        //         columnWidths,
        //         [
        //             BluetoothEscposPrinter.ALIGN.LEFT,
        //             BluetoothEscposPrinter.ALIGN.CENTER,
        //             BluetoothEscposPrinter.ALIGN.RIGHT,
        //         ],
        //         // ["TOTAL", ":", `${(netTotal - totalDiscountAmount + totalGST).toFixed(2)}`],
        //         ["TOTAL (Excl GST)", ":", `${totalAmountWithGSTInclCalculate(netTotal, totalGST)}`],
        //         {},
        //     )

        addedProducts[0]?.gst_flag === "Y" &&
          gstKeys.map(
            async key =>
              await BluetoothEscposPrinter.printColumn(
                columnWidths,
                [
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.CENTER,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                ],
                [
                  `${key.includes("CGST") ? "CGST" : "SGST"} @${key
                    .replace(/total(CGST|SGST)_/, "")
                    .replace("_", ".")}%`,
                  ":",
                  gstTotals[key].toFixed(2).toString(),
                ],
                {},
              ),
          )

        addedProducts[0]?.gst_flag === "Y" &&
          (await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ["TOTAL GST", ":", totalGST.toFixed(2).toString()],
            {},
          ))

        addedProducts[0]?.discount_flag === "Y" &&
          (await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            //@ts-ignore
            ["DISCOUNT", ":", parseFloat(totalDiscountAmount).toFixed(2)],
            {},
          ))

        addedProducts[0]?.gst_type === "E"
          ? await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            // ["TOTAL", ":", `${(netTotal - totalDiscountAmount + totalGST).toFixed(2)}`],
            [
              "TOTAL",
              ":",
              `${netTotalWithGSTCalculate(
                netTotal,
                totalDiscountAmount,
                totalGST,
              )}`,
            ],
            {},
          )
          : await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            // ["TOTAL", ":", `${(netTotal - totalDiscountAmount + totalGST).toFixed(2)}`],
            [
              "TOTAL",
              ":",
              `${netTotalWithGSTInclCalculate(
                netTotal,
                totalDiscountAmount,
              )}`,
            ],
            {},
          )
        // : await BluetoothEscposPrinter.printColumn(
        //     columnWidths,
        //     [
        //         BluetoothEscposPrinter.ALIGN.LEFT,
        //         BluetoothEscposPrinter.ALIGN.CENTER,
        //         BluetoothEscposPrinter.ALIGN.RIGHT,
        //     ],
        //     // ["TOTAL", ":", `${(netTotal - totalDiscountAmount + totalGST).toFixed(2)}`],
        //     ["TOTAL", ":", `${totalAmountWithGSTInclCalculate(netTotal, totalGST)}`],
        //     {},
        // )

        // addedProducts[0]?.gst_flag === "Y"
        //     && await BluetoothEscposPrinter.printColumn(
        //         columnWidths,
        //         [
        //             BluetoothEscposPrinter.ALIGN.LEFT,
        //             BluetoothEscposPrinter.ALIGN.CENTER,
        //             BluetoothEscposPrinter.ALIGN.RIGHT,
        //         ],
        //         ["TOTAL GST", ":", (totalGST).toFixed(2).toString()],
        //         {},
        //     )

        addedProducts[0]?.gst_type === "E"
          ? await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            // ["ROUND OFF", ":", `${(Math.round(parseFloat((netTotal - totalDiscountAmount + totalGST).toFixed(2))) - parseFloat((netTotal - totalDiscountAmount + totalGST).toFixed(2))).toFixed(2)}`],
            [
              "ROUND OFF",
              ":",
              `${roundingOffWithGSTCalculate(
                netTotal,
                totalDiscountAmount,
                totalGST,
              )}`,
            ],
            {},
          )
          : await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            // ["ROUND OFF", ":", `${(Math.round(parseFloat((netTotal - totalDiscountAmount + totalGST).toFixed(2))) - parseFloat((netTotal - totalDiscountAmount + totalGST).toFixed(2))).toFixed(2)}`],
            [
              "ROUND OFF",
              ":",
              `${roundingOffWithGSTInclCalculate(
                netTotal,
                totalDiscountAmount,
              )}`,
            ],
            {},
          )

        // await BluetoothEscposPrinter.printColumn(
        //     columnWidths,
        //     [
        //         BluetoothEscposPrinter.ALIGN.LEFT,
        //         BluetoothEscposPrinter.ALIGN.CENTER,
        //         BluetoothEscposPrinter.ALIGN.RIGHT,
        //     ],
        //     // ["NET AMT", ":", `${Math.round(parseFloat((netTotal - totalDiscountAmount + totalGST).toFixed(2)))}`],
        //     ["NET AMT", ":", `${grandTotalWithGSTCalculate(netTotal, totalDiscountAmount, totalGST)}`],
        //     {},
        // )

        addedProducts[0]?.gst_type === "E"
          ? await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            // ["NET AMT", ":", `${Math.round(parseFloat((netTotal - totalDiscountAmount + totalGST).toFixed(2)))}`],
            [
              "NET AMT",
              ":",
              `${grandTotalWithGSTCalculate(
                netTotal,
                totalDiscountAmount,
                totalGST,
              )}`,
            ],
            {},
          )
          : await BluetoothEscposPrinter.printColumn(
            columnWidths,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            // ["NET AMT", ":", `${Math.round(parseFloat((netTotal - totalDiscountAmount + totalGST).toFixed(2)))}`],
            [
              "NET AMT",
              ":",
              `${grandTotalWithGSTInclCalculate(
                netTotal,
                totalDiscountAmount,
              )}`,
            ],
            {},
          )

        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })
        !cancelFlag && (await BluetoothEscposPrinter.printText("\n", {}))

        if (!cancelFlag) {
          if (addedProducts[0]?.rcv_cash_flag === "Y") {
            if (!isRefunded && paymentMode === "C") {
              await BluetoothEscposPrinter.printText("PAYMENT MODE", {
                align: "center",
              })
              await BluetoothEscposPrinter.printText("\n", {})
              await BluetoothEscposPrinter.printText(
                `CASH RECEIVED:       ${cashAmount}`,
                { align: "center" },
              )
              await BluetoothEscposPrinter.printText("\n", {})
              await BluetoothEscposPrinter.printText(
                `RETURNED AMT:        ${returnedAmt}`,
                { align: "center" },
              )

              await BluetoothEscposPrinter.printText("\n", {})
              await BluetoothEscposPrinter.printText(
                "------------------------",
                {
                  align: "center",
                },
              )
            }
          } else {
            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printText(
              `TOTAL RETURNED AMT:        ${Math.abs(returnedAmt)}`,
              { align: "center" },
            )

            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printText("------------------------", {
              align: "center",
            })
            await BluetoothEscposPrinter.printText("\n", {})
          }
        }

        if (!cancelFlag) {
          await BluetoothEscposPrinter.printText("\n", {})

          if (paymentMode === "R") {
            await BluetoothEscposPrinter.printText("PAYMENT MODE", {
              align: "center",
            })
            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printText(
              `CASH RECEIVED:       ${cashAmount}`,
              { align: "center" },
            )
            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printText(
              `DUE AMT:        ${Math.abs(returnedAmt)}`,
              { align: "center" },
            )

            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printText("------------------------", {
              align: "center",
            })
            await BluetoothEscposPrinter.printText("\n", {})
          }

          if (paymentMode === "D") {
            await BluetoothEscposPrinter.printText(
              `RECEIVED:       ${grandTotalCalculate(
                netTotal,
                totalDiscountAmount,
              )} [CARD]`,
              { align: "center" },
            )
            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printText("------------------------", {
              align: "center",
            })
            await BluetoothEscposPrinter.printText("\n", {})
          }

          if (paymentMode === "U") {
            receiptSettings?.gst_type === "E"
              ? await BluetoothEscposPrinter.printText(
                `RECEIVED:       ${grandTotalWithGSTCalculate(
                  netTotal,
                  totalDiscountAmount,
                  totalGST,
                )} [UPI]`,
                { align: "center" },
              )
              : await BluetoothEscposPrinter.printText(
                `RECEIVED:       ${grandTotalWithGSTInclCalculate(
                  netTotal,
                  totalDiscountAmount,
                )} [UPI]`,
                { align: "center" },
              )
            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printText("------------------------", {
              align: "center",
            })
          }
        }

        if (isRefunded)
          addedProducts[0]?.gst_type === "E"
            ? await BluetoothEscposPrinter.printText(
              `REFUNDED AMT:    ${grandTotalWithGSTCalculate(
                netTotal,
                totalDiscountAmount,
                totalGST,
              )}`,
              { align: "center" },
            )
            : await BluetoothEscposPrinter.printText(
              `REFUNDED AMT:    ${grandTotalWithGSTInclCalculate(
                netTotal,
                totalDiscountAmount,
              )}`,
              { align: "center" },
            )
        await BluetoothEscposPrinter.printText("\n", {})

        if (receiptSettings?.on_off_flag3 === "Y") {
          await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
          await BluetoothEscposPrinter.printText("\n", {})
        }
        if (receiptSettings?.on_off_flag4 === "Y") {
          await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
        }
        await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText(
        //     "THANK YOU, VISIT AGAIN!",
        //     { align: "center" },
        // )
        // await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText("------X------", {})
        await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
      }
    } catch (e) {
      console.log(e.message || "ERROR")
    }
  }


  async function printSaleReport(
    saleReport: SaleReport[],
    fromDate: string,
    toDate: string,
  ) {
    const loginStore = JSON.parse(loginStorage.getString("login-data"))
    const fileStore = fileStorage.getString("comp_picture")

    const shopName: string = loginStore?.company_name?.toString()
    const address: string = loginStore?.address?.toString()
    const location: string = loginStore?.branch_name?.toString()
    const shopMobile: string = loginStore?.phone_no?.toString()
    const shopEmail: string = loginStore?.email_id?.toString()
    // const cashier: string = loginStore?.user_name?.toString()

    let totalQuantities: number = 0
    let totalPrice: number = 0
    let totalDiscount: number = 0
    let totalGSTs: number = 0
    let totalNet: number = 0
    let slNo: number = 0

    try {
      if (receiptSettings?.print_op === '1' || receiptSettings?.print_op === '2') {
        let columnWidths = [11, 1, 18]
        let columnWidthsHeader = [8, 1, 21]
        let columnWidthsProductsHeaderAndBody = [5, 4, 7, 6, 6, 4] // 0 in hand
        // let columnWidthsProductsHeaderAndBody = [18, 3, 4, 3, 4]
        let columnWidthsTotals = [15, 15]
        let columnWidthIfNameIsBig = [32]

        // let newColumnWidths: number[] = [9, 9, 6, 7]

        if (fileStore?.length > 0) {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          const options = {
            width: 250, // Assuming 58mm paper width with 8 dots/mm resolution (58mm * 8dots/mm = 384 dots)
            left: 50, // No left padding
            // align: "CENTER"
          }

          // Print the image
          const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
            ? fileStore.split("data:application/octet-stream;base64,")[1]

            : fileStore
          console.log(pureBase64, 'purbase64 er indicator dao reprint!')
          if (receiptSettings?.logo_flag == 'Y')
            await BluetoothEscposPrinter.printPic(pureBase64, options)
          // await BluetoothEscposPrinter.printPic(fileStore, options)
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
          align: "center",
          widthtimes: 1.2,
          heigthtimes: 2,
        })
        await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText("hasifughaf", { align: "center" })

        // if (receiptSettings?.on_off_flag1 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.header1, {})
        //     await BluetoothEscposPrinter.printText("\n", {})
        // }

        // if (receiptSettings?.on_off_flag2 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.header2, {})
        // }
        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("SALE REPORT", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `From: ${new Date(fromDate).toLocaleDateString(
            "en-GB",
          )}  To: ${new Date(toDate).toLocaleDateString("en-GB")}`,
          {},
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        // await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText(address, {
        //   align: "center",
        // })
        // await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText(location, {
        //   align: "center",
        // })
        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText("------------------------", {
        //   align: "center",
        // })
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        receiptSettings?.gst_flag === "Y"
          ? await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ["SL.", "QTY", "PRC", "DIS", "GST", "NET"],
            {},
          )
          : await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ["SL.", "QTY", "PRC", "DIS", "", "NET"],
            {},
          )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        for (const item of saleReport) {
          let totalGST: number = 0

          totalGST += item?.cgst_amt + item?.sgst_amt
          totalQuantities += item?.no_of_items
          totalPrice += item?.price
          totalDiscount += item?.discount_amt
          totalGSTs += totalGST
          totalNet += item?.net_amt + item?.round_off
          slNo++

          receiptSettings?.gst_flag === "Y"
            ? await BluetoothEscposPrinter.printColumn(
              columnWidthsProductsHeaderAndBody,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              [
                slNo.toString(),
                // item?.receipt_no
                //   ?.toString()
                //   ?.substring(item?.receipt_no?.toString()?.length - 4),
                item?.no_of_items?.toString(),
                item?.price?.toFixed(2)?.toString(),
                item?.discount_amt?.toString(),
                totalGST?.toString(),
                (item?.net_amt + item?.round_off)?.toString(),
              ],
              {},
            )
            : await BluetoothEscposPrinter.printColumn(
              columnWidthsProductsHeaderAndBody,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              [
                slNo.toString(),
                // item?.receipt_no
                //   ?.toString()
                //   ?.substring(item?.receipt_no?.toString()?.length - 4),
                item?.no_of_items?.toString(),
                item?.price?.toFixed(2)?.toString(),
                item?.discount_amt?.toString(),
                "",
                (item?.net_amt + item?.round_off)?.toString(),
              ],
              {},
            )
        }

        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printColumn(
        //     columnWidthsProductsHeaderAndBody,
        //     [
        //         BluetoothEscposPrinter.ALIGN.LEFT,
        //         BluetoothEscposPrinter.ALIGN.LEFT,
        //         BluetoothEscposPrinter.ALIGN.LEFT,
        //         BluetoothEscposPrinter.ALIGN.RIGHT,
        //         BluetoothEscposPrinter.ALIGN.RIGHT,
        //         BluetoothEscposPrinter.ALIGN.RIGHT,
        //     ],
        //     ["TOT", totalQuantities.toFixed(2).toString(), totalPrice?.toFixed(2)?.toString(), totalDiscount?.toString(), totalGSTs?.toFixed(2)?.toString(), totalNet?.toFixed(2)?.toString()],
        //     {},
        // )

        await BluetoothEscposPrinter.printColumn(
          columnWidthsTotals,
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
          [
            `QTY: ${totalQuantities.toString()}`,
            `MRP: ${totalPrice?.toFixed(2)?.toString()}`,
          ],
          {},
        )

        receiptSettings?.gst_flag === "Y"
          ? await BluetoothEscposPrinter.printColumn(
            columnWidthsTotals,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              `DISC: ${totalDiscount?.toFixed(2)?.toString()}`,
              `GST: ${totalGSTs?.toFixed(2)?.toString()}`,
            ],
            {},
          )
          : await BluetoothEscposPrinter.printColumn(
            columnWidthIfNameIsBig,
            [BluetoothEscposPrinter.ALIGN.CENTER],
            [`DISC: ${totalDiscount?.toFixed(2)?.toString()}`],
            {},
          )

        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `NET TOTAL:   ${totalNet?.toFixed(2)?.toString()}`,
          { align: "center" },
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })
        // await BluetoothEscposPrinter.printText("\n", {})

        // if (receiptSettings?.on_off_flag3 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
        //     await BluetoothEscposPrinter.printText("\n", {})
        // }
        // if (receiptSettings?.on_off_flag4 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
        // }
        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText(
        //     "THANK YOU, VISIT AGAIN!",
        //     { align: "center" },
        // )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------X------", { align: "center" })
        await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
      } else if (receiptSettings?.print_op === '3') {
        let columnWidths = [11, 1, 18]
        let columnWidthsHeader = [8, 1, 21]
        let columnWidthsProductsHeaderAndBody = [7, 6, 9, 8, 8, 6] // 0 in hand
        // let columnWidthsProductsHeaderAndBody = [18, 3, 4, 3, 4]
        let columnWidthsTotals = [15, 15]
        let columnWidthIfNameIsBig = [32]



        // let newColumnWidths: number[] = [9, 9, 6, 7]

        if (fileStore?.length > 0) {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          const options = {
            width: 250, // Assuming 58mm paper width with 8 dots/mm resolution (58mm * 8dots/mm = 384 dots)
            left: 50, // No left padding
            // align: "CENTER"
          }

          // Print the image
          const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
            ? fileStore.split("data:application/octet-stream;base64,")[1]

            : fileStore
          console.log(pureBase64, 'purbase64 er indicator dao reprint!')
          if (receiptSettings?.logo_flag == 'Y')
            await BluetoothEscposPrinter.printPic(pureBase64, options)
          // await BluetoothEscposPrinter.printPic(fileStore, options)
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
          align: "center",
          widthtimes: 1.2,
          heigthtimes: 2,
        })
        await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText("hasifughaf", { align: "center" })

        // if (receiptSettings?.on_off_flag1 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.header1, {})
        //     await BluetoothEscposPrinter.printText("\n", {})
        // }

        // if (receiptSettings?.on_off_flag2 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.header2, {})
        // }
        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("SALE REPORT", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `From: ${new Date(fromDate).toLocaleDateString(
            "en-GB",
          )}  To: ${new Date(toDate).toLocaleDateString("en-GB")}`,
          {},
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        // await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText(address, {
        //   align: "center",
        // })
        // await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText(location, {
        //   align: "center",
        // })
        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText("------------------------", {
        //   align: "center",
        // })
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        receiptSettings?.gst_flag === "Y"
          ? await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ["SL.", "QTY", "PRC", "DIS", "GST", "NET"],
            {},
          )
          : await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ["SL.", "QTY", "PRC", "DIS", "", "NET"],
            {},
          )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        for (const item of saleReport) {
          let totalGST: number = 0

          totalGST += item?.cgst_amt + item?.sgst_amt
          totalQuantities += item?.no_of_items
          totalPrice += item?.price
          totalDiscount += item?.discount_amt
          totalGSTs += totalGST
          totalNet += item?.net_amt + item?.round_off
          slNo++

          receiptSettings?.gst_flag === "Y"
            ? await BluetoothEscposPrinter.printColumn(
              columnWidthsProductsHeaderAndBody,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              [
                slNo.toString(),
                // item?.receipt_no
                //   ?.toString()
                //   ?.substring(item?.receipt_no?.toString()?.length - 4),
                item?.no_of_items?.toString(),
                item?.price?.toFixed(2)?.toString(),
                item?.discount_amt?.toString(),
                totalGST?.toString(),
                (item?.net_amt + item?.round_off)?.toString(),
              ],
              {},
            )
            : await BluetoothEscposPrinter.printColumn(
              columnWidthsProductsHeaderAndBody,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              [
                slNo.toString(),
                // item?.receipt_no
                //   ?.toString()
                //   ?.substring(item?.receipt_no?.toString()?.length - 4),
                item?.no_of_items?.toString(),
                item?.price?.toFixed(2)?.toString(),
                item?.discount_amt?.toString(),
                "",
                (item?.net_amt + item?.round_off)?.toString(),
              ],
              {},
            )
        }

        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printColumn(
        //     columnWidthsProductsHeaderAndBody,
        //     [
        //         BluetoothEscposPrinter.ALIGN.LEFT,
        //         BluetoothEscposPrinter.ALIGN.LEFT,
        //         BluetoothEscposPrinter.ALIGN.LEFT,
        //         BluetoothEscposPrinter.ALIGN.RIGHT,
        //         BluetoothEscposPrinter.ALIGN.RIGHT,
        //         BluetoothEscposPrinter.ALIGN.RIGHT,
        //     ],
        //     ["TOT", totalQuantities.toFixed(2).toString(), totalPrice?.toFixed(2)?.toString(), totalDiscount?.toString(), totalGSTs?.toFixed(2)?.toString(), totalNet?.toFixed(2)?.toString()],
        //     {},
        // )

        await BluetoothEscposPrinter.printColumn(
          columnWidthsTotals,
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
          [
            `QTY: ${totalQuantities.toString()}`,
            `MRP: ${totalPrice?.toFixed(2)?.toString()}`,
          ],
          {},
        )

        receiptSettings?.gst_flag === "Y"
          ? await BluetoothEscposPrinter.printColumn(
            columnWidthsTotals,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              `DISC: ${totalDiscount?.toFixed(2)?.toString()}`,
              `GST: ${totalGSTs?.toFixed(2)?.toString()}`,
            ],
            {},
          )
          : await BluetoothEscposPrinter.printColumn(
            columnWidthIfNameIsBig,
            [BluetoothEscposPrinter.ALIGN.CENTER],
            [`DISC: ${totalDiscount?.toFixed(2)?.toString()}`],
            {},
          )

        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `NET TOTAL:   ${totalNet?.toFixed(2)?.toString()}`,
          { align: "center" },
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })
        // await BluetoothEscposPrinter.printText("\n", {})

        // if (receiptSettings?.on_off_flag3 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
        //     await BluetoothEscposPrinter.printText("\n", {})
        // }
        // if (receiptSettings?.on_off_flag4 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
        // }
        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText(
        //     "THANK YOU, VISIT AGAIN!",
        //     { align: "center" },
        // )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------X------", { align: "center" })
        await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
      }
    } catch (e) {
      console.log(e.message || "ERROR")
    }
  }

  async function printCollectionReport(
    collectionReport: CollectionReport[],
    fromDate: string,
    toDate: string,
  ) {
    const loginStore = JSON.parse(loginStorage.getString("login-data"))
    const fileStore = fileStorage.getString("comp_picture")

    const shopName: string = loginStore?.company_name?.toString()
    const address: string = loginStore?.address?.toString()
    const location: string = loginStore?.branch_name?.toString()
    const shopMobile: string = loginStore?.phone_no?.toString()
    const shopEmail: string = loginStore?.email_id?.toString()
    // const cashier: string = loginStore?.user_name?.toString()

    let totalNet: number = 0
    let totalCancelled: number = 0

    try {
      if (receiptSettings?.print_op === "3") {
        let columnWidthsHeaderBody = [12, 12, 12, 12]
        const separator = "------------------------------------------------"

        if (fileStore?.length > 0) {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          const options = {
            width: 375, // Assuming 80mm paper
            left: 50,
          }
          const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
            ? fileStore.split("data:application/octet-stream;base64,")[1]

            : fileStore
          console.log(pureBase64, 'purbase64 er indicator dao reprint!')
          if (receiptSettings?.logo_flag == 'Y')
            await BluetoothEscposPrinter.printPic(pureBase64, options)
          // await BluetoothEscposPrinter.printPic(fileStore, options)
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
          align: "center",
          widthtimes: 1.2,
          heigthtimes: 2,
        })
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(separator, {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("SALE SUMMARY", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(separator, {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `From: ${new Date(fromDate).toLocaleDateString(
            "en-GB",
          )}  To: ${new Date(toDate).toLocaleDateString("en-GB")}`,
          {},
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(separator, {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeaderBody,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["MODE", "RCPTs", "NET", "CNCL"],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(separator, {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        for (const item of collectionReport) {
          totalNet += item?.net_amt
          totalCancelled += item?.can_amt

          await BluetoothEscposPrinter.printColumn(
            columnWidthsHeaderBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              item?.pay_mode === "C"
                ? "Cash"
                : item?.pay_mode === "U"
                  ? "UPI"
                  : item?.pay_mode === "D"
                    ? "Card"
                    : "Credit",
              item?.no_of_rcpt?.toString(),
              item?.net_amt?.toFixed(2),
              item?.can_amt?.toFixed(2),
            ],
            {},
          )
        }

        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(separator, {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `NET TOTAL:   ${totalNet?.toFixed(2)}`,
          { align: "center" },
        )
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `TOTAL CANCELLED:   ${totalCancelled?.toFixed(2)}`,
          { align: "center" },
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(separator, {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------X------", {})
        await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
      } else {
        let columnWidths = [11, 1, 18]
        let columnWidthsHeader = [8, 1, 21]
        let columnWidthsHeaderBody = [8, 7, 8, 9]
        let columnWidthsTotals = [15, 15]
        let columnWidthIfNameIsBig = [32]

        if (fileStore?.length > 0) {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          const options = {
            width: 250,
            left: 50,
          }
          const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
            ? fileStore.split("data:application/octet-stream;base64,")[1]

            : fileStore
          console.log(pureBase64, 'purbase64 er indicator dao reprint!')
          if (receiptSettings?.logo_flag == 'Y')
            await BluetoothEscposPrinter.printPic(pureBase64, options)
          // await BluetoothEscposPrinter.printPic(fileStore, options)
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
          align: "center",
          widthtimes: 1.2,
          heigthtimes: 2,
        })
        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("SALE SUMMARY", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `From: ${new Date(fromDate).toLocaleDateString(
            "en-GB",
          )}  To: ${new Date(toDate).toLocaleDateString("en-GB")}`,
          {},
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeaderBody,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["MODE", "RCPTs", "NET", "CNCL"],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        for (const item of collectionReport) {
          totalNet += item?.net_amt
          totalCancelled += item?.can_amt

          await BluetoothEscposPrinter.printColumn(
            columnWidthsHeaderBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              item?.pay_mode === "C"
                ? "Cash"
                : item?.pay_mode === "U"
                  ? "UPI"
                  : item?.pay_mode === "D"
                    ? "Card"
                    : "Credit",
              item?.no_of_rcpt?.toString(),
              item?.net_amt?.toFixed(2),
              item?.can_amt?.toFixed(2),
            ],
            {},
          )
        }

        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `NET TOTAL:   ${totalNet?.toFixed(2)}`,
          { align: "center" },
        )
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `TOTAL CANCELLED:   ${totalCancelled?.toFixed(2)}`,
          { align: "center" },
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------X------", {})
        await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
      }
    } catch (e) {
      console.log(e.message || "ERROR")
    }
  }

  async function printItemReport(
    itemReport: ItemReportData[],
    fromDate: string,
    toDate: string,
  ) {
    // ToastAndroid.show("Printing Item Reports will be added in some days.", ToastAndroid.SHORT)

    const loginStore = JSON.parse(loginStorage.getString("login-data"))
    const fileStore = fileStorage.getString("comp_picture")

    const shopName: string = loginStore?.company_name?.toString()
    const address: string = loginStore?.address?.toString()
    const location: string = loginStore?.branch_name?.toString()
    const shopMobile: string = loginStore?.phone_no?.toString()
    const shopEmail: string = loginStore?.email_id?.toString()
    // const cashier: string = loginStore?.user_name?.toString()

    let total: number = 0
    let totalQty: number = 0
    let slNo: number = 0

    try {
      if (receiptSettings?.print_op === '1' || receiptSettings?.print_op === '2') {
        let columnWidths = [11, 1, 18]
        let columnWidthsHeader = [8, 1, 21]
        // let columnWidthsProductsHeaderAndBody = [5, 4, 8, 6, 4, 4] // 1 in hand
        // let columnWidthsProductsHeaderAndBody = [18, 3, 4, 3, 4]
        // let columnWidthsHeaderBody = [12, 10, 10]
        let columnWidthsHeaderBody = [5, 12, 6, 5]
        let columnWidthsTotals = [15, 15]
        let columnWidthIfNameIsBig = [32]

        // let newColumnWidths: number[] = [9, 9, 6, 7]

        if (fileStore?.length > 0) {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          const options = {
            width: 250, // Assuming 58mm paper width with 8 dots/mm resolution (58mm * 8dots/mm = 384 dots)
            left: 50, // No left padding
            // align: "CENTER"
          }

          // Print the image
          const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
            ? fileStore.split("data:application/octet-stream;base64,")[1]

            : fileStore
          console.log(pureBase64, 'purbase64 er indicator dao reprint!')
          if (receiptSettings?.logo_flag == 'Y')
            await BluetoothEscposPrinter.printPic(pureBase64, options)
          // await BluetoothEscposPrinter.printPic(fileStore, options)
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
          align: "center",
          widthtimes: 1.2,
          heigthtimes: 2,
        })
        await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText("hasifughaf", { align: "center" })

        // if (receiptSettings?.on_off_flag1 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.header1, {})
        //     await BluetoothEscposPrinter.printText("\n", {})
        // }

        // if (receiptSettings?.on_off_flag2 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.header2, {})
        // }
        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("ITEM REPORT", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `From: ${new Date(fromDate).toLocaleDateString(
            "en-GB",
          )}  To: ${new Date(toDate).toLocaleDateString("en-GB")}`,
          {},
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        // await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText(address, {
        //   align: "center",
        // })
        // await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText(location, {
        //   align: "center",
        // })
        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText("------------------------", {
        //   align: "center",
        // })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeaderBody,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["SL.", "Item", "QTY", "PRC"],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        for (const item of itemReport) {
          total += item?.price
          totalQty += item?.qty
          slNo++

          await BluetoothEscposPrinter.printColumn(
            columnWidthsHeaderBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              slNo?.toString(),
              item?.item_name?.toString()?.slice(0, 14),
              item?.qty?.toString(),
              item?.price?.toString(),
            ],
            {},
          )
        }

        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `TOTAL: ${total?.toFixed(2)?.toString()} TOT QTY: ${totalQty}`,
          { align: "center" },
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })
        // await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------X------", {})
        await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
      } else if (receiptSettings?.print_op === '3') {
        let columnWidths = [11, 1, 18]
        let columnWidthsHeader = [8, 1, 21]
        // let columnWidthsProductsHeaderAndBody = [5, 4, 8, 6, 4, 4] // 1 in hand
        // let columnWidthsProductsHeaderAndBody = [18, 3, 4, 3, 4]
        // let columnWidthsHeaderBody = [12, 10, 10]
        let columnWidthsHeaderBody = [10, 17, 11, 10]
        let columnWidthsTotals = [15, 15]
        let columnWidthIfNameIsBig = [32]

        // let newColumnWidths: number[] = [9, 9, 6, 7]

        if (fileStore?.length > 0) {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          const options = {
            width: 250, // Assuming 58mm paper width with 8 dots/mm resolution (58mm * 8dots/mm = 384 dots)
            left: 50, // No left padding
            // align: "CENTER"
          }

          // Print the image
          const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
            ? fileStore.split("data:application/octet-stream;base64,")[1]

            : fileStore
          console.log(pureBase64, 'purbase64 er indicator dao reprint!')
          if (receiptSettings?.logo_flag == 'Y')
            await BluetoothEscposPrinter.printPic(pureBase64, options)
          // await BluetoothEscposPrinter.printPic(fileStore, options)
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
          align: "center",
          widthtimes: 1.2,
          heigthtimes: 2,
        })
        await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText("hasifughaf", { align: "center" })

        // if (receiptSettings?.on_off_flag1 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.header1, {})
        //     await BluetoothEscposPrinter.printText("\n", {})
        // }

        // if (receiptSettings?.on_off_flag2 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.header2, {})
        // }
        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("ITEM REPORT", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `From: ${new Date(fromDate).toLocaleDateString(
            "en-GB",
          )}  To: ${new Date(toDate).toLocaleDateString("en-GB")}`,
          {},
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        // await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText(address, {
        //   align: "center",
        // })
        // await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText(location, {
        //   align: "center",
        // })
        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText("------------------------", {
        //   align: "center",
        // })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeaderBody,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["SL.", "Item", "QTY", "PRC"],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        for (const item of itemReport) {
          total += item?.price
          totalQty += item?.qty
          slNo++

          await BluetoothEscposPrinter.printColumn(
            columnWidthsHeaderBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              slNo?.toString(),
              item?.item_name?.toString()?.slice(0, 14),
              item?.qty?.toString(),
              item?.price?.toString(),
            ],
            {},
          )
        }

        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `TOTAL: ${total?.toFixed(2)?.toString()} TOT QTY: ${totalQty}`,
          { align: "center" },
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })
        // await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------X------", {})
        await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
      }
    } catch (e) {
      console.log(e.message || "ERROR")
    }
  }

  async function printGstStatement(
    gstStatement: GstStatement[],
    fromDate: string,
    toDate: string,
  ) {
    const loginStore = JSON.parse(loginStorage.getString("login-data"))
    const fileStore = fileStorage.getString("comp_picture")

    const shopName: string = loginStore?.company_name?.toString()
    const address: string = loginStore?.address?.toString()
    const location: string = loginStore?.branch_name?.toString()
    const shopMobile: string = loginStore?.phone_no?.toString()
    const shopEmail: string = loginStore?.email_id?.toString()
    // const cashier: string = loginStore?.user_name?.toString()

    let totalCGST: number = 0
    let totalSGST: number = 0
    let totalTaxes: number = 0

    try {
      if (receiptSettings?.print_op === '1' || receiptSettings?.print_op === '2') {
        let columnWidths = [11, 1, 18]
        let columnWidthsHeader = [8, 1, 21]
        // let columnWidthsProductsHeaderAndBody = [5, 4, 8, 6, 4, 4] // 1 in hand
        // let columnWidthsProductsHeaderAndBody = [5, 5, 5, 8, 8] // 1 in hand
        let columnWidthsProductsHeaderAndBody = [8, 5, 5, 8] // 6 in hand
        // let columnWidthsProductsHeaderAndBody = [18, 3, 4, 3, 4]
        let columnWidthsTotals = [15, 15]
        let columnWidthIfNameIsBig = [32]

        // let newColumnWidths: number[] = [9, 9, 6, 7]

        if (fileStore?.length > 0) {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          const options = {
            width: 250, // Assuming 58mm paper width with 8 dots/mm resolution (58mm * 8dots/mm = 384 dots)
            left: 50, // No left padding
            // align: "CENTER"
          }

          // Print the image
          const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
            ? fileStore.split("data:application/octet-stream;base64,")[1]

            : fileStore
          console.log(pureBase64, 'purbase64 er indicator dao reprint!')
          if (receiptSettings?.logo_flag == 'Y')
            await BluetoothEscposPrinter.printPic(pureBase64, options)
          // await BluetoothEscposPrinter.printPic(fileStore, options)
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
          align: "center",
          widthtimes: 1.2,
          heigthtimes: 2,
        })
        await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText("hasifughaf", { align: "center" })

        // if (receiptSettings?.on_off_flag1 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.header1, {})
        //     await BluetoothEscposPrinter.printText("\n", {})
        // }

        // if (receiptSettings?.on_off_flag2 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.header2, {})
        // }
        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("GST STATEMENT", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `From: ${new Date(fromDate).toLocaleDateString(
            "en-GB",
          )}  To: ${new Date(toDate).toLocaleDateString("en-GB")}`,
          {},
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        // await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText(address, {
        //   align: "center",
        // })
        // await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText(location, {
        //   align: "center",
        // })
        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText("------------------------", {
        //   align: "center",
        // })
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsProductsHeaderAndBody,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
            // BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          // ["RCPT", "CGST", "SGST", "TOT_TAX", "TAX_AMT"],
          ["RCPT", "CGST", "SGST", "TOT_TAX"],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        for (const item of gstStatement) {
          totalCGST += item?.cgst_amt
          totalSGST += item?.sgst_amt
          totalTaxes += item?.total_tax

          await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              // BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            // [item?.receipt_no?.toString()?.substring(item?.receipt_no?.toString()?.length - 4), item?.cgst_amt?.toString(), item?.sgst_amt?.toString(), item?.total_tax?.toString(), item?.taxable_amt?.toString()],
            [
              item?.receipt_no
                ?.toString()
                ?.substring(item?.receipt_no?.toString()?.length - 4),
              item?.cgst_amt?.toString(),
              item?.sgst_amt?.toString(),
              item?.total_tax?.toString(),
            ],
            {},
          )
        }

        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printColumn(
          columnWidthsTotals,
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
          [
            `CGST: ${totalCGST?.toFixed(2)?.toString()}`,
            `SGST: ${totalSGST?.toFixed(2)?.toString()}`,
          ],
          {},
        )
        // await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `Total Taxes: ${totalTaxes?.toFixed(2)?.toString()}`,
          {},
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        // if (receiptSettings?.on_off_flag3 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
        //     await BluetoothEscposPrinter.printText("\n", {})
        // }
        // if (receiptSettings?.on_off_flag4 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
        // }
        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText(
        //     "THANK YOU, VISIT AGAIN!",
        //     { align: "center" },
        // )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------X------", {})
        await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
      } else if (receiptSettings?.print_op === '3') {
        let columnWidths = [11, 1, 18]
        let columnWidthsHeader = [8, 1, 21]
        // let columnWidthsProductsHeaderAndBody = [5, 4, 8, 6, 4, 4] // 1 in hand
        // let columnWidthsProductsHeaderAndBody = [5, 5, 5, 8, 8] // 1 in hand
        let columnWidthsProductsHeaderAndBody = [11, 8, 8, 11] // 6 in hand
        // let columnWidthsProductsHeaderAndBody = [18, 3, 4, 3, 4]
        let columnWidthsTotals = [15, 15]
        let columnWidthIfNameIsBig = [32]

        // let newColumnWidths: number[] = [9, 9, 6, 7]

        if (fileStore?.length > 0) {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          const options = {
            width: 250, // Assuming 58mm paper width with 8 dots/mm resolution (58mm * 8dots/mm = 384 dots)
            left: 50, // No left padding
            // align: "CENTER"
          }

          // Print the image
          const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
            ? fileStore.split("data:application/octet-stream;base64,")[1]

            : fileStore
          console.log(pureBase64, 'purbase64 er indicator dao reprint!')
          if (receiptSettings?.logo_flag == 'Y')
            await BluetoothEscposPrinter.printPic(pureBase64, options)
          // await BluetoothEscposPrinter.printPic(fileStore, options)
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
          align: "center",
          widthtimes: 1.2,
          heigthtimes: 2,
        })
        await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText("hasifughaf", { align: "center" })

        // if (receiptSettings?.on_off_flag1 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.header1, {})
        //     await BluetoothEscposPrinter.printText("\n", {})
        // }

        // if (receiptSettings?.on_off_flag2 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.header2, {})
        // }
        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("GST STATEMENT", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `From: ${new Date(fromDate).toLocaleDateString(
            "en-GB",
          )}  To: ${new Date(toDate).toLocaleDateString("en-GB")}`,
          {},
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        // await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText(address, {
        //   align: "center",
        // })
        // await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText(location, {
        //   align: "center",
        // })
        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText("------------------------", {
        //   align: "center",
        // })
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsProductsHeaderAndBody,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
            // BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          // ["RCPT", "CGST", "SGST", "TOT_TAX", "TAX_AMT"],
          ["RCPT", "CGST", "SGST", "TOT_TAX"],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        for (const item of gstStatement) {
          totalCGST += item?.cgst_amt
          totalSGST += item?.sgst_amt
          totalTaxes += item?.total_tax

          await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              // BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            // [item?.receipt_no?.toString()?.substring(item?.receipt_no?.toString()?.length - 4), item?.cgst_amt?.toString(), item?.sgst_amt?.toString(), item?.total_tax?.toString(), item?.taxable_amt?.toString()],
            [
              item?.receipt_no
                ?.toString()
                ?.substring(item?.receipt_no?.toString()?.length - 4),
              item?.cgst_amt?.toString(),
              item?.sgst_amt?.toString(),
              item?.total_tax?.toString(),
            ],
            {},
          )
        }

        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printColumn(
          columnWidthsTotals,
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
          [
            `CGST: ${totalCGST?.toFixed(2)?.toString()}`,
            `SGST: ${totalSGST?.toFixed(2)?.toString()}`,
          ],
          {},
        )
        // await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `Total Taxes: ${totalTaxes?.toFixed(2)?.toString()}`,
          {},
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        // if (receiptSettings?.on_off_flag3 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
        //     await BluetoothEscposPrinter.printText("\n", {})
        // }
        // if (receiptSettings?.on_off_flag4 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
        // }
        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText(
        //     "THANK YOU, VISIT AGAIN!",
        //     { align: "center" },
        // )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------X------", {})
        await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
      }
    } catch (e) {
      console.log(e.message || "ERROR")
    }
  }

  async function printGstSummary(
    gstSummary: GstSummary[],
    fromDate: string,
    toDate: string,
  ) {
    const loginStore = JSON.parse(loginStorage.getString("login-data"))
    const fileStore = fileStorage.getString("comp_picture")

    const shopName: string = loginStore?.company_name?.toString()
    const address: string = loginStore?.address?.toString()
    const location: string = loginStore?.branch_name?.toString()
    const shopMobile: string = loginStore?.phone_no?.toString()
    const shopEmail: string = loginStore?.email_id?.toString()
    // const cashier: string = loginStore?.user_name?.toString()

    let totalCGSTP: number = 0
    let totalCGST: number = 0
    let totalSGST: number = 0
    let totalTaxes: number = 0

    try {
      let columnWidths = [11, 1, 18]
      let columnWidthsHeader = [8, 1, 21]
      // let columnWidthsProductsHeaderAndBody = [5, 4, 8, 6, 4, 4] // 1 in hand
      // let columnWidthsProductsHeaderAndBody = [5, 5, 5, 8, 8] // 1 in hand
      let columnWidthsProductsHeaderAndBody = [8, 7, 7, 8] // 2 in hand
      // let columnWidthsProductsHeaderAndBody = [18, 3, 4, 3, 4]
      let columnWidthsTotals = [15, 15]
      let columnWidthIfNameIsBig = [32]

      // let newColumnWidths: number[] = [9, 9, 6, 7]

      if (fileStore?.length > 0) {
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        const options = {
          width: 250, // Assuming 58mm paper width with 8 dots/mm resolution (58mm * 8dots/mm = 384 dots)
          left: 50, // No left padding
          // align: "CENTER"
        }

        // Print the image
        const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
          ? fileStore.split("data:application/octet-stream;base64,")[1]

          : fileStore
        console.log(pureBase64, 'purbase64 er indicator dao reprint!')
        if (receiptSettings?.logo_flag == 'Y')
          await BluetoothEscposPrinter.printPic(pureBase64, options)
        // await BluetoothEscposPrinter.printPic(fileStore, options)
      }

      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.CENTER,
      )
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
        align: "center",
        widthtimes: 1.2,
        heigthtimes: 2,
      })
      await BluetoothEscposPrinter.printText("\n", {})
      // await BluetoothEscposPrinter.printText("hasifughaf", { align: "center" })

      // if (receiptSettings?.on_off_flag1 === "Y") {
      //     await BluetoothEscposPrinter.printText(receiptSettings?.header1, {})
      //     await BluetoothEscposPrinter.printText("\n", {})
      // }

      // if (receiptSettings?.on_off_flag2 === "Y") {
      //     await BluetoothEscposPrinter.printText(receiptSettings?.header2, {})
      // }
      // await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("GST SUMMARY", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})

      await BluetoothEscposPrinter.printText(
        `From: ${new Date(fromDate).toLocaleDateString(
          "en-GB",
        )}  To: ${new Date(toDate).toLocaleDateString("en-GB")}`,
        {},
      )

      await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      // await BluetoothEscposPrinter.printText("\n", {})
      // await BluetoothEscposPrinter.printText(address, {
      //   align: "center",
      // })
      // await BluetoothEscposPrinter.printText("\n", {})
      // await BluetoothEscposPrinter.printText(location, {
      //   align: "center",
      // })
      // await BluetoothEscposPrinter.printText("\n", {})

      // await BluetoothEscposPrinter.printText("------------------------", {
      //   align: "center",
      // })
      await BluetoothEscposPrinter.printText("\n", {})

      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.CENTER,
      )
      await BluetoothEscposPrinter.printColumn(
        columnWidthsProductsHeaderAndBody,
        [
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.CENTER,
          BluetoothEscposPrinter.ALIGN.RIGHT,
          // BluetoothEscposPrinter.ALIGN.RIGHT,
        ],
        // ["RCPT", "CGST", "SGST", "TOT_TAX", "TAX_AMT"],
        ["PRTG", "CGST", "SGST", "TOT_TAX"],
        {},
      )
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})

      for (const item of gstSummary) {
        totalCGSTP += item?.cgst_prtg
        totalCGST += item?.cgst_amt
        totalSGST += item?.sgst_amt
        totalTaxes += item?.total_tax

        await BluetoothEscposPrinter.printColumn(
          columnWidthsProductsHeaderAndBody,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
            // BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          // [item?.receipt_no?.toString()?.substring(item?.receipt_no?.toString()?.length - 4), item?.cgst_amt?.toString(), item?.sgst_amt?.toString(), item?.total_tax?.toString(), item?.taxable_amt?.toString()],
          [
            `${item?.cgst_prtg?.toString()}%`,
            item?.cgst_amt?.toString(),
            item?.sgst_amt?.toString(),
            item?.total_tax?.toString(),
          ],
          {},
        )
      }

      // await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})

      await BluetoothEscposPrinter.printColumn(
        columnWidthsTotals,
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
        [
          `CGST: ${totalCGST?.toFixed(2)?.toString()}`,
          `SGST: ${totalSGST?.toFixed(2)?.toString()}`,
        ],
        {},
      )
      // await BluetoothEscposPrinter.printColumn(
      //     columnWidthsTotals,
      //     [
      //         BluetoothEscposPrinter.ALIGN.LEFT,
      //         BluetoothEscposPrinter.ALIGN.RIGHT,
      //     ],
      //     [``, `Total Tax: ${totalTaxes?.toString()}`],
      //     {},
      // )
      // await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printText(
        `Total Tax: ${totalTaxes?.toFixed(2)?.toString()}`,
        { align: "center" },
      )
      await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      // await BluetoothEscposPrinter.printText("\n", {})
      // if (receiptSettings?.on_off_flag3 === "Y") {
      //     await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
      //     await BluetoothEscposPrinter.printText("\n", {})
      // }
      // if (receiptSettings?.on_off_flag4 === "Y") {
      //     await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
      // }
      // await BluetoothEscposPrinter.printText("\n", {})

      // await BluetoothEscposPrinter.printText(
      //     "THANK YOU, VISIT AGAIN!",
      //     { align: "center" },
      // )

      await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------X------", {})
      await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
    } catch (e) {
      console.log(e.message || "ERROR")
    }
  }

  async function printStockReport(stockReport: StockReportResponse[]) {
    const loginStore = JSON.parse(loginStorage.getString("login-data"))
    const fileStore = fileStorage.getString("comp_picture")

    const shopName: string = loginStore?.company_name?.toString()
    const address: string = loginStore?.address?.toString()
    const location: string = loginStore?.branch_name?.toString()
    const shopMobile: string = loginStore?.phone_no?.toString()
    const shopEmail: string = loginStore?.email_id?.toString()
    // const cashier: string = loginStore?.user_name?.toString()

    // let totalCGSTP: number = 0
    // let totalCGST: number = 0
    // let totalSGST: number = 0
    // let totalTaxes: number = 0
    let totalQty: number = 0
    let totalGrossStock: number = 0

    try {
      if (receiptSettings?.print_op === '1' || receiptSettings?.print_op === '2') {
        let columnWidths = [11, 1, 18]
        let columnWidthsHeader = [8, 1, 21]
        // let columnWidthsProductsHeaderAndBody = [5, 4, 8, 6, 4, 4] // 1 in hand
        // let columnWidthsProductsHeaderAndBody = [5, 5, 5, 8, 8] // 1 in hand
        // let columnWidthsProductsHeaderAndBody = [8, 7, 7, 8] // 2 in hand
        let columnWidthsProductsHeaderAndBody = [19, 9] // 2 in hand
        // let columnWidthsProductsHeaderAndBody = [18, 3, 4, 3, 4]
        let columnWidthsTotals = [15, 15]
        let columnWidthIfNameIsBig = [32]

        // let newColumnWidths: number[] = [9, 9, 6, 7]

        if (fileStore?.length > 0) {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          const options = {
            width: 250, // Assuming 58mm paper width with 8 dots/mm resolution (58mm * 8dots/mm = 384 dots)
            left: 50, // No left padding
            // align: "CENTER"
          }

          // Print the image
          const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
            ? fileStore.split("data:application/octet-stream;base64,")[1]

            : fileStore
          console.log(pureBase64, 'purbase64 er indicator dao reprint!')
          if (receiptSettings?.logo_flag == 'Y')
            await BluetoothEscposPrinter.printPic(pureBase64, options)
          // await BluetoothEscposPrinter.printPic(fileStore, options)
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
          align: "center",
          widthtimes: 1.2,
          heigthtimes: 2,
        })
        await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText("hasifughaf", { align: "center" })

        // if (receiptSettings?.on_off_flag1 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.header1, {})
        //     await BluetoothEscposPrinter.printText("\n", {})
        // }

        // if (receiptSettings?.on_off_flag2 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.header2, {})
        // }
        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("STOCK REPORT", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText(`From: ${new Date(fromDate).toLocaleDateString("en-GB")}  To: ${new Date(toDate).toLocaleDateString("en-GB")}`, {})

        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        // await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText(address, {
        //   align: "center",
        // })
        // await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText(location, {
        //   align: "center",
        // })
        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText("------------------------", {
        //   align: "center",
        // })
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsProductsHeaderAndBody,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
            // BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          // ["RCPT", "CGST", "SGST", "TOT_TAX", "TAX_AMT"],
          ["Product", "Stock"],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        for (const item of stockReport) {
          totalQty += 1
          totalGrossStock += item?.stock

          await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              // BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              `${totalQty}. ${item?.item_name?.toString()?.slice(0, 14)}`,
              `${item?.stock?.toString()} ${item?.unit_name?.toString() || ""}`,
            ],
            {},
          )
        }

        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printColumn(
          columnWidthsTotals,
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
          [
            `TOTAL QTY: ${totalQty?.toString()}`,
            `TOTAL GROSS: ${totalGrossStock?.toString()}`,
          ],
          {},
        )
        // await BluetoothEscposPrinter.printColumn(
        //     columnWidthsTotals,
        //     [
        //         BluetoothEscposPrinter.ALIGN.LEFT,
        //         BluetoothEscposPrinter.ALIGN.RIGHT,
        //     ],
        //     [``, `Total Tax: ${totalTaxes?.toString()}`],
        //     {},
        // )
        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        // await BluetoothEscposPrinter.printText("\n", {})
        // if (receiptSettings?.on_off_flag3 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
        //     await BluetoothEscposPrinter.printText("\n", {})
        // }
        // if (receiptSettings?.on_off_flag4 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
        // }
        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText(
        //     "THANK YOU, VISIT AGAIN!",
        //     { align: "center" },
        // )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------X------", {})
        await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
      } else if (receiptSettings?.print_op === '3') {
        let columnWidths = [11, 1, 18]
        let columnWidthsHeader = [8, 1, 21]
        // let columnWidthsProductsHeaderAndBody = [5, 4, 8, 6, 4, 4] // 1 in hand
        // let columnWidthsProductsHeaderAndBody = [5, 5, 5, 8, 8] // 1 in hand
        // let columnWidthsProductsHeaderAndBody = [8, 7, 7, 8] // 2 in hand
        let columnWidthsProductsHeaderAndBody = [25, 15] // 2 in hand
        // let columnWidthsProductsHeaderAndBody = [18, 3, 4, 3, 4]
        let columnWidthsTotals = [20, 20]
        let columnWidthIfNameIsBig = [32]

        // let newColumnWidths: number[] = [9, 9, 6, 7]

        if (fileStore?.length > 0) {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          const options = {
            width: 250, // Assuming 58mm paper width with 8 dots/mm resolution (58mm * 8dots/mm = 384 dots)
            left: 50, // No left padding
            // align: "CENTER"
          }

          // Print the image
          const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
            ? fileStore.split("data:application/octet-stream;base64,")[1]

            : fileStore
          console.log(pureBase64, 'purbase64 er indicator dao reprint!')
          if (receiptSettings?.logo_flag == 'Y')
            await BluetoothEscposPrinter.printPic(pureBase64, options)
          // await BluetoothEscposPrinter.printPic(fileStore, options)
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
          align: "center",
          widthtimes: 1.2,
          heigthtimes: 2,
        })
        await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText("hasifughaf", { align: "center" })

        // if (receiptSettings?.on_off_flag1 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.header1, {})
        //     await BluetoothEscposPrinter.printText("\n", {})
        // }

        // if (receiptSettings?.on_off_flag2 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.header2, {})
        // }
        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("STOCK REPORT", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText(`From: ${new Date(fromDate).toLocaleDateString("en-GB")}  To: ${new Date(toDate).toLocaleDateString("en-GB")}`, {})

        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        // await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText(address, {
        //   align: "center",
        // })
        // await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText(location, {
        //   align: "center",
        // })
        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText("------------------------", {
        //   align: "center",
        // })
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsProductsHeaderAndBody,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
            // BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          // ["RCPT", "CGST", "SGST", "TOT_TAX", "TAX_AMT"],
          ["Product", "Stock"],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        for (const item of stockReport) {
          totalQty += 1
          totalGrossStock += item?.stock

          await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              // BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              `${totalQty}. ${item?.item_name?.toString()?.slice(0, 14)}`,
              `${item?.stock?.toString()} ${item?.unit_name?.toString() || ""}`,
            ],
            {},
          )
        }

        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printColumn(
          columnWidthsTotals,
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
          [
            `TOTAL QTY: ${totalQty?.toString()}`,
            `TOTAL GROSS: ${totalGrossStock?.toString()}`,
          ],
          {},
        )
        // await BluetoothEscposPrinter.printColumn(
        //     columnWidthsTotals,
        //     [
        //         BluetoothEscposPrinter.ALIGN.LEFT,
        //         BluetoothEscposPrinter.ALIGN.RIGHT,
        //     ],
        //     [``, `Total Tax: ${totalTaxes?.toString()}`],
        //     {},
        // )
        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        // await BluetoothEscposPrinter.printText("\n", {})
        // if (receiptSettings?.on_off_flag3 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
        //     await BluetoothEscposPrinter.printText("\n", {})
        // }
        // if (receiptSettings?.on_off_flag4 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
        // }
        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText(
        //     "THANK YOU, VISIT AGAIN!",
        //     { align: "center" },
        // )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------X------", {})
        await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
      }
    } catch (e) {
      console.log(e.message || "ERROR")
    }
  }

  async function printUserwiseReport(
    userwiseReport: UserwiseReportData[],
    fromDate: string,
    toDate: string,
  ) {
    const loginStore = JSON.parse(loginStorage.getString("login-data"))
    const fileStore = fileStorage.getString("comp_picture")

    const shopName: string = loginStore?.company_name?.toString()
    const address: string = loginStore?.address?.toString()
    const location: string = loginStore?.branch_name?.toString()
    const shopMobile: string = loginStore?.phone_no?.toString()
    const shopEmail: string = loginStore?.email_id?.toString()
    // const cashier: string = loginStore?.user_name?.toString()

    let totalNet: number = 0
    let totalCancelled: number = 0

    try {
      if (receiptSettings?.print_op === '1' || receiptSettings?.print_op === '2') {
        let columnWidths = [11, 1, 18]
        let columnWidthsHeader = [8, 1, 21]
        // let columnWidthsProductsHeaderAndBody = [5, 4, 8, 6, 4, 4] // 1 in hand
        // let columnWidthsProductsHeaderAndBody = [18, 3, 4, 3, 4]
        let columnWidthsHeaderBody = [8, 7, 8, 9]
        let columnWidthsTotals = [15, 15]
        let columnWidthIfNameIsBig = [32]

        // let newColumnWidths: number[] = [9, 9, 6, 7]

        if (fileStore?.length > 0) {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          const options = {
            width: 250, // Assuming 58mm paper width with 8 dots/mm resolution (58mm * 8dots/mm = 384 dots)
            left: 50, // No left padding
            // align: "CENTER"
          }

          // Print the image
          const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
            ? fileStore.split("data:application/octet-stream;base64,")[1]

            : fileStore
          console.log(pureBase64, 'purbase64 er indicator dao reprint!')
          if (receiptSettings?.logo_flag == 'Y')
            await BluetoothEscposPrinter.printPic(pureBase64, options)
          // await BluetoothEscposPrinter.printPic(fileStore, options)
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
          align: "center",
          widthtimes: 1.2,
          heigthtimes: 2,
        })
        await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText("hasifughaf", { align: "center" })

        // if (receiptSettings?.on_off_flag1 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.header1, {})
        //     await BluetoothEscposPrinter.printText("\n", {})
        // }

        // if (receiptSettings?.on_off_flag2 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.header2, {})
        // }
        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("USERWISE REPORT", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `From: ${new Date(fromDate).toLocaleDateString(
            "en-GB",
          )}  To: ${new Date(toDate).toLocaleDateString("en-GB")}`,
          {},
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        // await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText(address, {
        //   align: "center",
        // })
        // await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText(location, {
        //   align: "center",
        // })
        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText("------------------------", {
        //   align: "center",
        // })
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeaderBody,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["USER", "RCPTs", "NET", "CNCL"],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        for (const item of userwiseReport) {
          totalNet += item?.net_amt
          totalCancelled += item?.cancelled_amt

          await BluetoothEscposPrinter.printColumn(
            columnWidthsHeaderBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              item?.user_name?.toString(),
              item?.no_of_receipts?.toString(),
              item?.net_amt?.toFixed(2),
              item?.cancelled_amt?.toFixed(2),
            ],
            {},
          )
        }

        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText("------------------------", {
        //   align: "center",
        // })

        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText(
        //   `NET TOTAL:   ${totalNet?.toFixed(2)}`,
        //   { align: "center" },
        // )
        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText(
        //   `TOTAL CANCELLED:   ${totalCancelled?.toFixed(2)}`,
        //   { align: "center" },
        // )

        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText("------------------------", {
        //   align: "center",
        // })
        // await BluetoothEscposPrinter.printText("\n", {})

        // if (receiptSettings?.on_off_flag3 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
        //     await BluetoothEscposPrinter.printText("\n", {})
        // }
        // if (receiptSettings?.on_off_flag4 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
        // }
        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText(
        //     "THANK YOU, VISIT AGAIN!",
        //     { align: "center" },
        // )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------X------", {})
        await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
      } else if (receiptSettings?.print_op === '3') {
        let columnWidths = [11, 1, 18]
        let columnWidthsHeader = [8, 1, 21]
        // let columnWidthsProductsHeaderAndBody = [5, 4, 8, 6, 4, 4] // 1 in hand
        // let columnWidthsProductsHeaderAndBody = [18, 3, 4, 3, 4]
        let columnWidthsHeaderBody = [12, 12, 12, 12]
        let columnWidthsTotals = [15, 15]
        let columnWidthIfNameIsBig = [32]

        // let newColumnWidths: number[] = [9, 9, 6, 7]

        if (fileStore?.length > 0) {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          const options = {
            width: 250, // Assuming 58mm paper width with 8 dots/mm resolution (58mm * 8dots/mm = 384 dots)
            left: 50, // No left padding
            // align: "CENTER"
          }

          // Print the image
          const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
            ? fileStore.split("data:application/octet-stream;base64,")[1]

            : fileStore
          console.log(pureBase64, 'purbase64 er indicator dao reprint!')
          if (receiptSettings?.logo_flag == 'Y')
            await BluetoothEscposPrinter.printPic(pureBase64, options)
          // await BluetoothEscposPrinter.printPic(fileStore, options)
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
          align: "center",
          widthtimes: 1.2,
          heigthtimes: 2,
        })
        await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText("hasifughaf", { align: "center" })

        // if (receiptSettings?.on_off_flag1 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.header1, {})
        //     await BluetoothEscposPrinter.printText("\n", {})
        // }

        // if (receiptSettings?.on_off_flag2 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.header2, {})
        // }
        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("USERWISE REPORT", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `From: ${new Date(fromDate).toLocaleDateString(
            "en-GB",
          )}  To: ${new Date(toDate).toLocaleDateString("en-GB")}`,
          {},
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        // await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText(address, {
        //   align: "center",
        // })
        // await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText(location, {
        //   align: "center",
        // })
        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText("------------------------", {
        //   align: "center",
        // })
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeaderBody,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["USER", "RCPTs", "NET", "CNCL"],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        for (const item of userwiseReport) {
          totalNet += item?.net_amt
          totalCancelled += item?.cancelled_amt

          await BluetoothEscposPrinter.printColumn(
            columnWidthsHeaderBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              item?.user_name?.toString(),
              item?.no_of_receipts?.toString(),
              item?.net_amt?.toFixed(2),
              item?.cancelled_amt?.toFixed(2),
            ],
            {},
          )
        }

        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText("------------------------", {
        //   align: "center",
        // })

        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText(
        //   `NET TOTAL:   ${totalNet?.toFixed(2)}`,
        //   { align: "center" },
        // )
        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText(
        //   `TOTAL CANCELLED:   ${totalCancelled?.toFixed(2)}`,
        //   { align: "center" },
        // )

        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText("------------------------", {
        //   align: "center",
        // })
        // await BluetoothEscposPrinter.printText("\n", {})

        // if (receiptSettings?.on_off_flag3 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
        //     await BluetoothEscposPrinter.printText("\n", {})
        // }
        // if (receiptSettings?.on_off_flag4 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
        // }
        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText(
        //     "THANK YOU, VISIT AGAIN!",
        //     { align: "center" },
        // )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------X------", {})
        await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
      }
    } catch (e) {
      console.log(e.message || "ERROR")
    }
  }

  async function printCancelledBillsReport(
    cancelledBills: CancelledBillsReportData[],
    fromDate: string,
    toDate: string,
  ) {
    const loginStore = JSON.parse(loginStorage.getString("login-data"))
    const fileStore = fileStorage.getString("comp_picture")

    const shopName: string = loginStore?.company_name?.toString()
    const address: string = loginStore?.address?.toString()
    const location: string = loginStore?.branch_name?.toString()
    const shopMobile: string = loginStore?.phone_no?.toString()
    const shopEmail: string = loginStore?.email_id?.toString()
    // const cashier: string = loginStore?.user_name?.toString()

    let totalNet: number = 0
    let totalGst: number = 0
    let totalDis: number = 0
    let slNo: number = 0

    try {
      if (receiptSettings?.print_op === '1' || receiptSettings?.print_op === '2') {
        let columnWidths = [11, 1, 18]
        let columnWidthsHeader = [8, 1, 21]
        // let columnWidthsProductsHeaderAndBody = [5, 4, 8, 6, 4, 4] // 1 in hand
        // let columnWidthsProductsHeaderAndBody = [18, 3, 4, 3, 4]
        // let columnWidthsHeaderBody = [12, 10, 10]
        let columnWidthsProductsHeaderAndBody = [5, 4, 7, 6, 6, 4]
        let columnWidthsTotals = [15, 15]
        let columnWidthIfNameIsBig = [32]

        // let newColumnWidths: number[] = [9, 9, 6, 7]

        if (fileStore?.length > 0) {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          const options = {
            width: 250, // Assuming 58mm paper width with 8 dots/mm resolution (58mm * 8dots/mm = 384 dots)
            left: 50, // No left padding
            // align: "CENTER"
          }

          // Print the image
          const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
            ? fileStore.split("data:application/octet-stream;base64,")[1]

            : fileStore
          console.log(pureBase64, 'purbase64 er indicator dao reprint!')
          if (receiptSettings?.logo_flag == 'Y')
            await BluetoothEscposPrinter.printPic(pureBase64, options)
          // await BluetoothEscposPrinter.printPic(fileStore, options)
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
          align: "center",
          widthtimes: 1.2,
          heigthtimes: 2,
        })
        await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText("hasifughaf", { align: "center" })

        // if (receiptSettings?.on_off_flag1 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.header1, {})
        //     await BluetoothEscposPrinter.printText("\n", {})
        // }

        // if (receiptSettings?.on_off_flag2 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.header2, {})
        // }
        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("CANCELLED BILLS REPORT", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `From: ${new Date(fromDate).toLocaleDateString(
            "en-GB",
          )}  To: ${new Date(toDate).toLocaleDateString("en-GB")}`,
          {},
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        // await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText(address, {
        //   align: "center",
        // })
        // await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText(location, {
        //   align: "center",
        // })
        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText("------------------------", {
        //   align: "center",
        // })
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsProductsHeaderAndBody,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["SL.", "QTY", "PRC", "DIS", "GST", "NET"],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        for (const item of cancelledBills) {
          totalNet += item?.net_amt
          totalGst += item?.cgst_amt + item?.sgst_amt
          totalDis += item?.discount_amt
          slNo++
          await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              slNo.toString(),
              item?.no_of_items?.toString(),
              item?.price?.toString(),
              item?.discount_amt?.toString(),
              (item?.cgst_amt + item?.sgst_amt)?.toString(),
              item?.net_amt?.toString()
            ],
            {},
          )
        }

        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText("------------------------", {
        //   align: "center",
        // })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `TOTAL CANCELLED:   ${totalNet?.toFixed(2)?.toString()}`,
          { align: "center" },
        )
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `GST:   ${totalGst?.toFixed(2)?.toString()}   DISC:   ${totalDis?.toFixed(2)?.toString()}`,
          { align: "center" },
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })
        // await BluetoothEscposPrinter.printText("\n", {})

        // if (receiptSettings?.on_off_flag3 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
        //     await BluetoothEscposPrinter.printText("\n", {})
        // }
        // if (receiptSettings?.on_off_flag4 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
        // }
        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText(
        //     "THANK YOU, VISIT AGAIN!",
        //     { align: "center" },
        // )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------X------", {})
        await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
      } else if (receiptSettings?.print_op === '3') {
        let columnWidths = [11, 1, 18]
        let columnWidthsHeader = [8, 1, 21]
        // let columnWidthsProductsHeaderAndBody = [5, 4, 8, 6, 4, 4] // 1 in hand
        // let columnWidthsProductsHeaderAndBody = [18, 3, 4, 3, 4]
        // let columnWidthsHeaderBody = [12, 10, 10]
        let columnWidthsProductsHeaderAndBody = [7, 7, 9, 8, 8, 7]
        let columnWidthsTotals = [15, 15]
        let columnWidthIfNameIsBig = [32]

        // let newColumnWidths: number[] = [9, 9, 6, 7]

        if (fileStore?.length > 0) {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          const options = {
            width: 250, // Assuming 58mm paper width with 8 dots/mm resolution (58mm * 8dots/mm = 384 dots)
            left: 50, // No left padding
            // align: "CENTER"
          }

          // Print the image
          const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
            ? fileStore.split("data:application/octet-stream;base64,")[1]

            : fileStore
          console.log(pureBase64, 'purbase64 er indicator dao reprint!')
          if (receiptSettings?.logo_flag == 'Y')
            await BluetoothEscposPrinter.printPic(pureBase64, options)
          // await BluetoothEscposPrinter.printPic(fileStore, options)
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
          align: "center",
          widthtimes: 1.2,
          heigthtimes: 2,
        })
        await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText("hasifughaf", { align: "center" })

        // if (receiptSettings?.on_off_flag1 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.header1, {})
        //     await BluetoothEscposPrinter.printText("\n", {})
        // }

        // if (receiptSettings?.on_off_flag2 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.header2, {})
        // }
        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("CANCELLED BILLS REPORT", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `From: ${new Date(fromDate).toLocaleDateString(
            "en-GB",
          )}  To: ${new Date(toDate).toLocaleDateString("en-GB")}`,
          {},
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        // await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText(address, {
        //   align: "center",
        // })
        // await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText(location, {
        //   align: "center",
        // })
        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText("------------------------", {
        //   align: "center",
        // })
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsProductsHeaderAndBody,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["SL.", "QTY", "PRC", "DIS", "GST", "NET"],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        for (const item of cancelledBills) {
          totalNet += item?.net_amt
          totalGst += item?.cgst_amt + item?.sgst_amt
          totalDis += item?.discount_amt
          slNo++
          await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              slNo.toString(),
              item?.no_of_items?.toString(),
              item?.price?.toString(),
              item?.discount_amt?.toString(),
              (item?.cgst_amt + item?.sgst_amt)?.toString(),
              item?.net_amt?.toString()
            ],
            {},
          )
        }

        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText("------------------------", {
        //   align: "center",
        // })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `TOTAL CANCELLED:   ${totalNet?.toFixed(2)?.toString()}`,
          { align: "center" },
        )
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `GST:   ${totalGst?.toFixed(2)?.toString()}   DISC:   ${totalDis?.toFixed(2)?.toString()}`,
          { align: "center" },
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })
        // await BluetoothEscposPrinter.printText("\n", {})

        // if (receiptSettings?.on_off_flag3 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
        //     await BluetoothEscposPrinter.printText("\n", {})
        // }
        // if (receiptSettings?.on_off_flag4 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
        // }
        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText(
        //     "THANK YOU, VISIT AGAIN!",
        //     { align: "center" },
        // )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------X------", {})
        await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
      }
    } catch (e) {
      console.log(e.message || "ERROR")
    }
  }

  async function printRefundReport(
    refundReport: RefundReportData[],
    fromDate: string,
    toDate: string,
  ) {
    const loginStore = JSON.parse(loginStorage.getString("login-data"))
    const fileStore = fileStorage.getString("comp_picture")

    const shopName: string = loginStore?.company_name?.toString()
    const address: string = loginStore?.address?.toString()
    const location: string = loginStore?.branch_name?.toString()
    const shopMobile: string = loginStore?.phone_no?.toString()
    const shopEmail: string = loginStore?.email_id?.toString()
    // const cashier: string = loginStore?.user_name?.toString()

    let totalQuantities: number = 0
    let totalPrice: number = 0
    let totalDiscount: number = 0
    let totalGSTs: number = 0
    let totalNet: number = 0

    try {
      if (receiptSettings?.print_op === '3') {
        let columnWidths = [15, 1, 32]
        let columnWidthsHeader = [12, 1, 35]
        let columnWidthsProductsHeaderAndBody = [7, 6, 9, 8, 8, 6]
        let columnWidthsTotals = [24, 24]
        let columnWidthIfNameIsBig = [48]

        if (fileStore?.length > 0) {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          const options = {
            width: 375,
            left: 50,
          }
          const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
            ? fileStore.split("data:application/octet-stream;base64,")[1]

            : fileStore
          console.log(pureBase64, 'purbase64 er indicator dao reprint!')
          if (receiptSettings?.logo_flag == 'Y')
            await BluetoothEscposPrinter.printPic(pureBase64, options)
          // await BluetoothEscposPrinter.printPic(fileStore, options)
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
          align: "center",
          widthtimes: 1.2,
          heigthtimes: 2,
        })
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("REFUND REPORT", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `From: ${new Date(fromDate).toLocaleDateString(
            "en-GB",
          )}  To: ${new Date(toDate).toLocaleDateString("en-GB")}`,
          {},
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printText(address, {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printText(location, {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        receiptSettings?.gst_flag === "Y"
          ? await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ["RCPT", "QTY", "PRC", "DIS", "GST", "NET"],
            {},
          )
          : await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ["RCPT", "QTY", "PRC", "DIS", "", "NET"],
            {},
          )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        for (const item of refundReport) {
          let totalGST: number = 0

          totalGST += item?.cgst_amt + item?.sgst_amt
          totalQuantities += item?.no_of_items
          totalPrice += item?.price
          totalDiscount += item?.discount_amt
          totalGSTs += totalGST
          totalNet += item?.net_amt + item?.round_off

          receiptSettings?.gst_flag === "Y"
            ? await BluetoothEscposPrinter.printColumn(
              columnWidthsProductsHeaderAndBody,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              [
                item?.refund_rcpt_no
                  ?.toString()
                  ?.substring(item?.refund_rcpt_no?.toString()?.length - 4),
                item?.no_of_items?.toString(),
                item?.price?.toFixed(2)?.toString(),
                item?.discount_amt?.toString(),
                totalGST?.toString(),
                (item?.net_amt + item?.round_off)?.toString(),
              ],
              {},
            )
            : await BluetoothEscposPrinter.printColumn(
              columnWidthsProductsHeaderAndBody,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              [
                item?.refund_rcpt_no
                  ?.toString()
                  ?.substring(item?.refund_rcpt_no?.toString()?.length - 4),
                item?.no_of_items?.toString(),
                item?.price?.toFixed(2)?.toString(),
                item?.discount_amt?.toString(),
                "",
                (item?.net_amt + item?.round_off)?.toString(),
              ],
              {},
            )
        }

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printColumn(
          columnWidthsTotals,
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
          [
            `QTY: ${totalQuantities.toString()}`,
            `MRP: ${totalPrice?.toFixed(2)?.toString()}`,
          ],
          {},
        )

        receiptSettings?.gst_flag === "Y"
          ? await BluetoothEscposPrinter.printColumn(
            columnWidthsTotals,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              `DISC: ${totalDiscount?.toFixed(2)?.toString()}`,
              `GST: ${totalGSTs?.toFixed(2)?.toString()}`,
            ],
            {},
          )
          : await BluetoothEscposPrinter.printColumn(
            columnWidthIfNameIsBig,
            [BluetoothEscposPrinter.ALIGN.CENTER],
            [`DISC: ${totalDiscount?.toFixed(2)?.toString()}`],
            {},
          )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `NET TOTAL:   ${totalNet?.toFixed(2)?.toString()}`,
          { align: "center" },
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------X------", {})
        await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
      } else {
        let columnWidths = [11, 1, 18]
        let columnWidthsHeader = [8, 1, 21]
        let columnWidthsProductsHeaderAndBody = [5, 4, 7, 6, 6, 4] // 0 in hand
        // let columnWidthsProductsHeaderAndBody = [18, 3, 4, 3, 4]
        let columnWidthsTotals = [15, 15]
        let columnWidthIfNameIsBig = [32]

        // let newColumnWidths: number[] = [9, 9, 6, 7]

        if (fileStore?.length > 0) {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          const options = {
            width: 250, // Assuming 58mm paper width with 8 dots/mm resolution (58mm * 8dots/mm = 384 dots)
            left: 50, // No left padding
            // align: "CENTER"
          }

          // Print the image
          const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
            ? fileStore.split("data:application/octet-stream;base64,")[1]

            : fileStore
          console.log(pureBase64, 'purbase64 er indicator dao reprint!')
          if (receiptSettings?.logo_flag == 'Y')
            await BluetoothEscposPrinter.printPic(pureBase64, options)
          // await BluetoothEscposPrinter.printPic(fileStore, options)
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
          align: "center",
          widthtimes: 1.2,
          heigthtimes: 2,
        })
        await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText("hasifughaf", { align: "center" })

        // if (receiptSettings?.on_off_flag1 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.header1, {})
        //     await BluetoothEscposPrinter.printText("\n", {})
        // }

        // if (receiptSettings?.on_off_flag2 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.header2, {})
        // }
        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("REFUND REPORT", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `From: ${new Date(fromDate).toLocaleDateString(
            "en-GB",
          )}  To: ${new Date(toDate).toLocaleDateString("en-GB")}`,
          {},
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printText(address, {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printText(location, {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        receiptSettings?.gst_flag === "Y"
          ? await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ["RCPT", "QTY", "PRC", "DIS", "GST", "NET"],
            {},
          )
          : await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ["RCPT", "QTY", "PRC", "DIS", "", "NET"],
            {},
          )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        for (const item of refundReport) {
          let totalGST: number = 0

          totalGST += item?.cgst_amt + item?.sgst_amt
          totalQuantities += item?.no_of_items
          totalPrice += item?.price
          totalDiscount += item?.discount_amt
          totalGSTs += totalGST
          totalNet += item?.net_amt + item?.round_off

          receiptSettings?.gst_flag === "Y"
            ? await BluetoothEscposPrinter.printColumn(
              columnWidthsProductsHeaderAndBody,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              [
                item?.refund_rcpt_no
                  ?.toString()
                  ?.substring(item?.refund_rcpt_no?.toString()?.length - 4),
                item?.no_of_items?.toString(),
                item?.price?.toFixed(2)?.toString(),
                item?.discount_amt?.toString(),
                totalGST?.toString(),
                (item?.net_amt + item?.round_off)?.toString(),
              ],
              {},
            )
            : await BluetoothEscposPrinter.printColumn(
              columnWidthsProductsHeaderAndBody,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              [
                item?.refund_rcpt_no
                  ?.toString()
                  ?.substring(item?.refund_rcpt_no?.toString()?.length - 4),
                item?.no_of_items?.toString(),
                item?.price?.toFixed(2)?.toString(),
                item?.discount_amt?.toString(),
                "",
                (item?.net_amt + item?.round_off)?.toString(),
              ],
              {},
            )
        }

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printColumn(
        //     columnWidthsProductsHeaderAndBody,
        //     [
        //         BluetoothEscposPrinter.ALIGN.LEFT,
        //         BluetoothEscposPrinter.ALIGN.LEFT,
        //         BluetoothEscposPrinter.ALIGN.LEFT,
        //         BluetoothEscposPrinter.ALIGN.RIGHT,
        //         BluetoothEscposPrinter.ALIGN.RIGHT,
        //         BluetoothEscposPrinter.ALIGN.RIGHT,
        //     ],
        //     ["TOT", totalQuantities.toFixed(2).toString(), totalPrice?.toFixed(2)?.toString(), totalDiscount?.toString(), totalGSTs?.toFixed(2)?.toString(), totalNet?.toFixed(2)?.toString()],
        //     {},
        // )

        await BluetoothEscposPrinter.printColumn(
          columnWidthsTotals,
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
          [
            `QTY: ${totalQuantities.toString()}`,
            `MRP: ${totalPrice?.toFixed(2)?.toString()}`,
          ],
          {},
        )

        receiptSettings?.gst_flag === "Y"
          ? await BluetoothEscposPrinter.printColumn(
            columnWidthsTotals,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              `DISC: ${totalDiscount?.toFixed(2)?.toString()}`,
              `GST: ${totalGSTs?.toFixed(2)?.toString()}`,
            ],
            {},
          )
          : await BluetoothEscposPrinter.printColumn(
            columnWidthIfNameIsBig,
            [BluetoothEscposPrinter.ALIGN.CENTER],
            [`DISC: ${totalDiscount?.toFixed(2)?.toString()}`],
            {},
          )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `NET TOTAL:   ${totalNet?.toFixed(2)?.toString()}`,
          { align: "center" },
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})

        // if (receiptSettings?.on_off_flag3 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
        //     await BluetoothEscposPrinter.printText("\n", {})
        // }
        // if (receiptSettings?.on_off_flag4 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
        // }
        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText(
        //     "THANK YOU, VISIT AGAIN!",
        //     { align: "center" },
        // )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------X------", {})
        await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
      }
    } catch (e) {
      console.log(e.message || "ERROR")
    }
  }

  async function printCreditReport(
    creditReport: CreditReportResponseData[],
    fromDate: string,
    toDate: string,
  ) {
    const loginStore = JSON.parse(loginStorage.getString("login-data"))
    const fileStore = fileStorage.getString("comp_picture")

    const shopName: string = loginStore?.company_name?.toString()
    const address: string = loginStore?.address?.toString()
    const location: string = loginStore?.branch_name?.toString()
    const shopMobile: string = loginStore?.phone_no?.toString()
    const shopEmail: string = loginStore?.email_id?.toString()
    // const cashier: string = loginStore?.user_name?.toString()

    let totalNet: number = 0
    let totalDue: number = 0

    try {
      if (receiptSettings?.print_op === '3') {
        let columnWidths = [11, 1, 18]
        let columnWidthsHeader = [8, 1, 21]
        // let columnWidthsProductsHeaderAndBody = [5, 4, 7, 6, 6, 4] // 0 in hand
        let columnWidthsProductsHeaderAndBody = [11, 8, 6, 7] // 0 in hand
        // let columnWidthsProductsHeaderAndBody = [18, 3, 4, 3, 4]
        let columnWidthsTotals = [15, 15]
        let columnWidthIfNameIsBig = [32]

        // let newColumnWidths: number[] = [9, 9, 6, 7]

        if (fileStore?.length > 0) {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          const options = {
            width: 250, // Assuming 58mm paper width with 8 dots/mm resolution (58mm * 8dots/mm = 384 dots)
            left: 50, // No left padding
            // align: "CENTER"
          }

          // Print the image
          const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
            ? fileStore.split("data:application/octet-stream;base64,")[1]

            : fileStore
          console.log(pureBase64, 'purbase64 er indicator dao reprint!')
          if (receiptSettings?.logo_flag == 'Y')
            await BluetoothEscposPrinter.printPic(pureBase64, options)
          // await BluetoothEscposPrinter.printPic(fileStore, options)
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
          align: "center",
          widthtimes: 1.2,
          heigthtimes: 2,
        })
        await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText("hasifughaf", { align: "center" })

        // if (receiptSettings?.on_off_flag1 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.header1, {})
        //     await BluetoothEscposPrinter.printText("\n", {})
        // }

        // if (receiptSettings?.on_off_flag2 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.header2, {})
        // }
        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("CREDIT REPORT", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `From: ${new Date(fromDate).toLocaleDateString(
            "en-GB",
          )}  To: ${new Date(toDate).toLocaleDateString("en-GB")}`,
          {},
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        // await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText(address, {
        //   align: "center",
        // })
        // await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText(location, {
        //   align: "center",
        // })
        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText("------------------------", {
        //   align: "center",
        // })
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidthsProductsHeaderAndBody,
          [
            // BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
            // BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["Rcpt No.", "Amount", "Paid Amt.", "Due Amt."],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        for (const item of creditReport) {
          totalNet += item?.net_amt
          totalDue += item?.due_amt
          // let totalGST: number = 0

          // totalGST += item?.cgst_amt + item?.sgst_amt
          // totalQuantities += item?.no_of_items
          // totalPrice += item?.price
          // totalDiscount += item?.discount_amt
          // totalGSTs += totalGST
          // totalNet += item?.net_amt + item?.round_off

          await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              item?.receipt_no
                ?.toString(),
              item?.net_amt?.toString(),
              item?.paid_amt?.toFixed(2),
              item?.due_amt?.toString(),
            ],
            {},
          )
        }

        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printColumn(
          columnWidthsTotals,
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
          [
            `TOTAL NET: ${totalNet.toString()}`,
            `TOTAL DUE: ${totalDue?.toFixed(2)}`,
          ],
          {},
        )

        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        // await BluetoothEscposPrinter.printText("\n", {})

        // if (receiptSettings?.on_off_flag3 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
        //     await BluetoothEscposPrinter.printText("\n", {})
        // }
        // if (receiptSettings?.on_off_flag4 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
        // }
        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText(
        //     "THANK YOU, VISIT AGAIN!",
        //     { align: "center" },
        // )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------X------", {})
        await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
      } else {
        let columnWidths = [11, 1, 18]
        let columnWidthsHeader = [8, 1, 21]
        // let columnWidthsProductsHeaderAndBody = [5, 4, 7, 6, 6, 4] // 0 in hand
        let columnWidthsProductsHeaderAndBody = [11, 8, 6, 7] // 0 in hand
        // let columnWidthsProductsHeaderAndBody = [18, 3, 4, 3, 4]
        let columnWidthsTotals = [15, 15]
        let columnWidthIfNameIsBig = [32]

        // let newColumnWidths: number[] = [9, 9, 6, 7]

        if (fileStore?.length > 0) {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          const options = {
            width: 250, // Assuming 58mm paper width with 8 dots/mm resolution (58mm * 8dots/mm = 384 dots)
            left: 50, // No left padding
            // align: "CENTER"
          }

          // Print the image
          const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
            ? fileStore.split("data:application/octet-stream;base64,")[1]

            : fileStore
          console.log(pureBase64, 'purbase64 er indicator dao reprint!')
          if (receiptSettings?.logo_flag == 'Y')
            await BluetoothEscposPrinter.printPic(pureBase64, options)
          // await BluetoothEscposPrinter.printPic(fileStore, options)
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
          align: "center",
          widthtimes: 1.2,
          heigthtimes: 2,
        })
        await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText("hasifughaf", { align: "center" })

        // if (receiptSettings?.on_off_flag1 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.header1, {})
        //     await BluetoothEscposPrinter.printText("\n", {})
        // }

        // if (receiptSettings?.on_off_flag2 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.header2, {})
        // }
        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("CREDIT REPORT", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `From: ${new Date(fromDate).toLocaleDateString(
            "en-GB",
          )}  To: ${new Date(toDate).toLocaleDateString("en-GB")}`,
          {},
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        // await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText(address, {
        //   align: "center",
        // })
        // await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText(location, {
        //   align: "center",
        // })
        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText("------------------------", {
        //   align: "center",
        // })
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidthsProductsHeaderAndBody,
          [
            // BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
            // BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["Rcpt No.", "Amount", "Paid Amt.", "Due Amt."],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        for (const item of creditReport) {
          totalNet += item?.net_amt
          totalDue += item?.due_amt
          // let totalGST: number = 0

          // totalGST += item?.cgst_amt + item?.sgst_amt
          // totalQuantities += item?.no_of_items
          // totalPrice += item?.price
          // totalDiscount += item?.discount_amt
          // totalGSTs += totalGST
          // totalNet += item?.net_amt + item?.round_off

          await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              item?.receipt_no
                ?.toString(),
              item?.net_amt?.toString(),
              item?.paid_amt?.toFixed(2),
              item?.due_amt?.toString(),
            ],
            {},
          )
        }

        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printColumn(
          columnWidthsTotals,
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
          [
            `TOTAL NET: ${totalNet.toString()}`,
            `TOTAL DUE: ${totalDue?.toFixed(2)}`,
          ],
          {},
        )

        // await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        // await BluetoothEscposPrinter.printText("\n", {})

        // if (receiptSettings?.on_off_flag3 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
        //     await BluetoothEscposPrinter.printText("\n", {})
        // }
        // if (receiptSettings?.on_off_flag4 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
        // }
        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText(
        //     "THANK YOU, VISIT AGAIN!",
        //     { align: "center" },
        // )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------X------", {})
        await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
      }
    } catch (e) {
      console.log(e.message || "ERROR")
    }
  }


  async function printRecovery(rcptNo: number, dueAmt: number, receivedAmt: number) {
    const loginStore = JSON.parse(loginStorage.getString("login-data"))
    const fileStore = fileStorage.getString("comp_picture")

    const shopName: string = loginStore?.company_name?.toString()
    const address: string = loginStore?.address?.toString()
    const location: string = loginStore?.branch_name?.toString()
    const shopMobile: string = loginStore?.phone_no?.toString()
    const shopEmail: string = loginStore?.email_id?.toString()
    // const cashier: string = loginStore?.user_name?.toString()

    let totalNet: number = 0
    let totalDue: number = 0

    try {
      let columnWidths = [11, 1, 18]
      let columnWidthsHeader = [8, 1, 21]
      // let columnWidthsProductsHeaderAndBody = [5, 4, 7, 6, 6, 4] // 0 in hand
      let columnWidthsProductsHeaderAndBody = [11, 8, 6, 7] // 0 in hand
      // let columnWidthsProductsHeaderAndBody = [18, 3, 4, 3, 4]
      let columnWidthsTotals = [15, 15]
      let columnWidthIfNameIsBig = [32]

      // let newColumnWidths: number[] = [9, 9, 6, 7]

      if (fileStore?.length > 0) {
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        const options = {
          width: 250, // Assuming 58mm paper width with 8 dots/mm resolution (58mm * 8dots/mm = 384 dots)
          left: 50, // No left padding
          // align: "CENTER"
        }

        // Print the image
        const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
          ? fileStore.split("data:application/octet-stream;base64,")[1]

          : fileStore
        console.log(pureBase64, 'purbase64 er indicator dao reprint!')
        if (receiptSettings?.logo_flag == 'Y')
          await BluetoothEscposPrinter.printPic(pureBase64, options)
        // await BluetoothEscposPrinter.printPic(fileStore, options)
      }

      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.CENTER,
      )
      await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
        align: "center",
        widthtimes: 1.2,
        heigthtimes: 2,
      })
      await BluetoothEscposPrinter.printText("\n", {})
      // await BluetoothEscposPrinter.printText("hasifughaf", { align: "center" })

      // if (receiptSettings?.on_off_flag1 === "Y") {
      //     await BluetoothEscposPrinter.printText(receiptSettings?.header1, {})
      //     await BluetoothEscposPrinter.printText("\n", {})
      // }

      // if (receiptSettings?.on_off_flag2 === "Y") {
      //     await BluetoothEscposPrinter.printText(receiptSettings?.header2, {})
      // }
      // await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("RECOVERY RECEIPT", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printText(address, {
        align: "center",
      })
      await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printText(location, {
        align: "center",
      })
      await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printColumn(
        columnWidthsTotals,
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
        [
          `Rcpt No.`,
          `${rcptNo.toString()}`,
        ],
        {},
      )
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })
      await BluetoothEscposPrinter.printText("\n", {})

      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.CENTER,
      )

      await BluetoothEscposPrinter.printText("\n", {})

      await BluetoothEscposPrinter.printColumn(
        columnWidthsTotals,
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
        [
          `DUE AMT: ${dueAmt}`,
          `RECEIVED: ${receivedAmt}`,
        ],
        {},
      )

      await BluetoothEscposPrinter.printText("\n", {})

      //@ts-ignore
      await BluetoothEscposPrinter.printText(`DUE: ${(parseFloat(dueAmt) - parseFloat(receivedAmt)).toFixed(2)}`, {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------X------", {})
      await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
    } catch (e) {
      console.log(e.message || "ERROR")
    }
  }

  async function printDaybookReport(daybookReport: DaybookReportData[], fromDate: string, toDate: string) {
    const loginStore = JSON.parse(loginStorage.getString("login-data"))
    const fileStore = fileStorage.getString("comp_picture")

    const shopName: string = loginStore?.company_name?.toString()
    const address: string = loginStore?.address?.toString()
    const location: string = loginStore?.branch_name?.toString()
    const shopMobile: string = loginStore?.phone_no?.toString()
    const shopEmail: string = loginStore?.email_id?.toString()
    // const cashier: string = loginStore?.user_name?.toString()

    let totalNet: number = 0
    let totalCancelled: number = 0
    let slNo: number = 0

    try {
      if (receiptSettings?.print_op === "3") {
        let columnWidthsHeaderBody = [5, 15, 14, 14]
        const separator = "------------------------------------------------"

        if (fileStore?.length > 0) {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          const options = {
            width: 375, // Assuming 80mm paper
            left: 50,
          }

          // Print the image
          const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
            ? fileStore.split("data:application/octet-stream;base64,")[1]

            : fileStore
          console.log(pureBase64, 'purbase64 er indicator dao reprint!')
          if (receiptSettings?.logo_flag == 'Y')
            await BluetoothEscposPrinter.printPic(pureBase64, options)
          // await BluetoothEscposPrinter.printPic(fileStore, options)
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
          align: "center",
          widthtimes: 1.2,
          heigthtimes: 2,
        })
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(separator, {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("DAYBOOK REPORT", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(separator, {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `From: ${new Date(fromDate).toLocaleDateString(
            "en-GB",
          )}  To: ${new Date(toDate).toLocaleDateString("en-GB")}`,
          {},
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(separator, {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeaderBody,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["SL.", "RCPT", "NET", "CNCLD"],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(separator, {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        for (const item of daybookReport) {
          totalNet += item?.net_amt
          totalCancelled += item?.cancelled_amt
          slNo++

          await BluetoothEscposPrinter.printColumn(
            columnWidthsHeaderBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              slNo.toString(),
              item?.receipt_no?.toString()?.substring(item?.receipt_no?.toString()?.length - 4),
              item?.net_amt?.toFixed(2),
              item?.cancelled_amt?.toFixed(2),
            ],
            {},
          )
        }

        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(separator, {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `NET TOTAL:   ${totalNet?.toFixed(2)?.toString()}`,
          { align: "center" },
        )
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `TOTAL CANCELLED:   ${totalCancelled?.toFixed(2)?.toString()}`,
          { align: "center" },
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(separator, {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------X------", {})
        await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
      } else {
        let columnWidths = [11, 1, 18]
        let columnWidthsHeader = [8, 1, 21]
        let columnWidthsHeaderBody = [5, 9, 9, 9]
        let columnWidthsTotals = [15, 15]
        let columnWidthIfNameIsBig = [32]

        if (fileStore?.length > 0) {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          const options = {
            width: 250,
            left: 50,
          }
          const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
            ? fileStore.split("data:application/octet-stream;base64,")[1]

            : fileStore
          console.log(pureBase64, 'purbase64 er indicator dao reprint!')
          if (receiptSettings?.logo_flag == 'Y')
            await BluetoothEscposPrinter.printPic(pureBase64, options)
          // await BluetoothEscposPrinter.printPic(fileStore, options)
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
          align: "center",
          widthtimes: 1.2,
          heigthtimes: 2,
        })
        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("DAYBOOK REPORT", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `From: ${new Date(fromDate).toLocaleDateString(
            "en-GB",
          )}  To: ${new Date(toDate).toLocaleDateString("en-GB")}`,
          {},
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsHeaderBody,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["SL.", "RCPT", "NET", "CNCLD"],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        for (const item of daybookReport) {
          totalNet += item?.net_amt
          totalCancelled += item?.cancelled_amt
          slNo++

          await BluetoothEscposPrinter.printColumn(
            columnWidthsHeaderBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              slNo.toString(),
              item?.receipt_no?.toString()?.substring(item?.receipt_no?.toString()?.length - 4),
              item?.net_amt?.toFixed(2),
              item?.cancelled_amt?.toFixed(2),
            ],
            {},
          )
        }

        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `NET TOTAL:   ${totalNet?.toFixed(2)?.toString()}`,
          { align: "center" },
        )
        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printText(
          `TOTAL CANCELLED:   ${totalCancelled?.toFixed(2)?.toString()}`,
          { align: "center" },
        )

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------X------", {})
        await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
      }
    } catch (e) {
      console.log(e.message || "ERROR")
    }
  }

  async function printDueReport(
    dueReport: DueReportData[],
    date: string,
  ) {
    const loginStore = JSON.parse(loginStorage.getString("login-data"))
    const fileStore = fileStorage.getString("comp_picture")

    const shopName: string = loginStore?.company_name?.toString()
    const address: string = loginStore?.address?.toString()
    const location: string = loginStore?.branch_name?.toString()
    const shopMobile: string = loginStore?.phone_no?.toString()
    const shopEmail: string = loginStore?.email_id?.toString()
    // const cashier: string = loginStore?.user_name?.toString()

    let totalQuantities: number = 0
    let totalPrice: number = 0
    let totalDiscount: number = 0
    let totalGSTs: number = 0
    let totalNet: number = 0

    try {
      let columnWidths = [11, 1, 18]
      let columnWidthsHeader = [8, 1, 21]
      // let columnWidthsProductsHeaderAndBody = [5, 4, 7, 6, 6, 4] // 0 in hand
      let columnWidthsProductsHeaderAndBody = [4, 8, 8, 8]
      // let columnWidthsTotals = [15, 15]
      let columnWidthsTotals = [32]
      let columnWidthIfNameIsBig = [32]

      // let newColumnWidths: number[] = [9, 9, 6, 7]

      if (fileStore?.length > 0) {
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        const options = {
          width: 250, // Assuming 58mm paper width with 8 dots/mm resolution (58mm * 8dots/mm = 384 dots)
          left: 50, // No left padding
          // align: "CENTER"
        }

        // Print the image
        const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
          ? fileStore.split("data:application/octet-stream;base64,")[1]

          : fileStore
        console.log(pureBase64, 'purbase64 er indicator dao reprint!')
        if (receiptSettings?.logo_flag == 'Y')
          await BluetoothEscposPrinter.printPic(pureBase64, options)
        // await BluetoothEscposPrinter.printPic(fileStore, options)
      }

      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.CENTER,
      )
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
        align: "center",
        widthtimes: 1.2,
        heigthtimes: 2,
      })
      await BluetoothEscposPrinter.printText("\n", {})
      // await BluetoothEscposPrinter.printText("hasifughaf", { align: "center" })

      // if (receiptSettings?.on_off_flag1 === "Y") {
      //     await BluetoothEscposPrinter.printText(receiptSettings?.header1, {})
      //     await BluetoothEscposPrinter.printText("\n", {})
      // }

      // if (receiptSettings?.on_off_flag2 === "Y") {
      //     await BluetoothEscposPrinter.printText(receiptSettings?.header2, {})
      // }
      // await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("DUE REPORT", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})

      await BluetoothEscposPrinter.printText(
        `Date: ${new Date(date).toLocaleDateString(
          "en-GB",
        )}`,
        {},
      )

      await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      // await BluetoothEscposPrinter.printText("\n", {})
      // await BluetoothEscposPrinter.printText(address, {
      //   align: "center",
      // })
      // await BluetoothEscposPrinter.printText("\n", {})
      // await BluetoothEscposPrinter.printText(location, {
      //   align: "center",
      // })
      // await BluetoothEscposPrinter.printText("\n", {})

      // await BluetoothEscposPrinter.printText("------------------------", {
      //   align: "center",
      // })
      await BluetoothEscposPrinter.printText("\n", {})

      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.CENTER,
      )

      await BluetoothEscposPrinter.printColumn(
        columnWidthsProductsHeaderAndBody,
        [
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.RIGHT,
          BluetoothEscposPrinter.ALIGN.RIGHT,
        ],
        ["Sl.", "NAME", "PH", "DUE"],
        {},
      )
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})

      let i = 0
      let totalDue = 0
      for (const item of dueReport) {
        i++
        totalDue += item?.due_amt
        await BluetoothEscposPrinter.printColumn(
          columnWidthsProductsHeaderAndBody,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            i?.toString(),
            item?.cust_name,
            item?.phone_no,
            item?.due_amt?.toString()
          ],
          {},
        )
      }
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})

      await BluetoothEscposPrinter.printColumn(
        columnWidthsTotals,
        [BluetoothEscposPrinter.ALIGN.CENTER],
        [
          `TOTAL DUE: ${totalDue.toString()}`,
        ],
        {},
      )
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })
      await BluetoothEscposPrinter.printText("\n", {})

      // if (receiptSettings?.on_off_flag3 === "Y") {
      //     await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
      //     await BluetoothEscposPrinter.printText("\n", {})
      // }
      // if (receiptSettings?.on_off_flag4 === "Y") {
      //     await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
      // }
      // await BluetoothEscposPrinter.printText("\n", {})

      // await BluetoothEscposPrinter.printText(
      //     "THANK YOU, VISIT AGAIN!",
      //     { align: "center" },
      // )

      // await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------X------", {})
      await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
    } catch (e) {
      console.log(e.message || "ERROR")
    }
  }

  async function printCustomerLedger(
    cusLed: CustomerLedgerData[]
  ) {
    const loginStore = JSON.parse(loginStorage.getString("login-data"))
    const fileStore = fileStorage.getString("comp_picture")

    const shopName: string = loginStore?.company_name?.toString()
    const address: string = loginStore?.address?.toString()
    const location: string = loginStore?.branch_name?.toString()
    const shopMobile: string = loginStore?.phone_no?.toString()
    const shopEmail: string = loginStore?.email_id?.toString()
    // const cashier: string = loginStore?.user_name?.toString()

    let totalQuantities: number = 0
    let totalPrice: number = 0
    let totalDiscount: number = 0
    let totalGSTs: number = 0
    let totalNet: number = 0

    try {
      let columnWidths = [11, 1, 18]
      let columnWidthsHeader = [8, 1, 21]
      // let columnWidthsProductsHeaderAndBody = [5, 4, 7, 6, 6, 4] // 0 in hand
      let columnWidthsProductsHeaderAndBody = [11, 6, 6, 7]
      // let columnWidthsTotals = [15, 15]
      let columnWidthsTotals = [32]
      let columnWidthIfNameIsBig = [32]

      // let newColumnWidths: number[] = [9, 9, 6, 7]

      if (fileStore?.length > 0) {
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        const options = {
          width: 250, // Assuming 58mm paper width with 8 dots/mm resolution (58mm * 8dots/mm = 384 dots)
          left: 50, // No left padding
          // align: "CENTER"
        }

        // Print the image
        const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
          ? fileStore.split("data:application/octet-stream;base64,")[1]

          : fileStore
        console.log(pureBase64, 'purbase64 er indicator dao reprint!')
        if (receiptSettings?.logo_flag == 'Y')
          await BluetoothEscposPrinter.printPic(pureBase64, options)
        // await BluetoothEscposPrinter.printPic(fileStore, options)
      }

      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.CENTER,
      )
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
        align: "center",
        widthtimes: 1.2,
        heigthtimes: 2,
      })
      await BluetoothEscposPrinter.printText("\n", {})
      // await BluetoothEscposPrinter.printText("hasifughaf", { align: "center" })

      // if (receiptSettings?.on_off_flag1 === "Y") {
      //     await BluetoothEscposPrinter.printText(receiptSettings?.header1, {})
      //     await BluetoothEscposPrinter.printText("\n", {})
      // }

      // if (receiptSettings?.on_off_flag2 === "Y") {
      //     await BluetoothEscposPrinter.printText(receiptSettings?.header2, {})
      // }
      // await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("CUSTOMER LEDGER", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})

      await BluetoothEscposPrinter.printText(
        `NAME: ${cusLed[0]?.cust_name}`,
        {},
      )
      await BluetoothEscposPrinter.printText("\n", {})

      await BluetoothEscposPrinter.printText(
        `PH.: ${cusLed[0]?.phone_no?.toString()}`,
        {},
      )

      await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      // await BluetoothEscposPrinter.printText("\n", {})
      // await BluetoothEscposPrinter.printText(address, {
      //   align: "center",
      // })
      // await BluetoothEscposPrinter.printText("\n", {})
      // await BluetoothEscposPrinter.printText(location, {
      //   align: "center",
      // })
      // await BluetoothEscposPrinter.printText("\n", {})

      // await BluetoothEscposPrinter.printText("------------------------", {
      //   align: "center",
      // })
      await BluetoothEscposPrinter.printText("\n", {})

      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.CENTER,
      )

      await BluetoothEscposPrinter.printColumn(
        columnWidthsProductsHeaderAndBody,
        [
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.RIGHT,
          BluetoothEscposPrinter.ALIGN.RIGHT,
        ],
        ["R. DT", "PAID", "DUE", "BAL"],
        {},
      )
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})

      let totalDue = 0
      for (const item of cusLed) {
        totalDue += item?.due_amt
        await BluetoothEscposPrinter.printColumn(
          columnWidthsProductsHeaderAndBody,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            item?.recover_dt,
            item?.paid_amt?.toString(),
            item?.due_amt?.toString(),
            item?.balance?.toString(),
          ],
          {},
        )
      }
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})

      await BluetoothEscposPrinter.printColumn(
        columnWidthsTotals,
        [BluetoothEscposPrinter.ALIGN.CENTER],
        [
          `TOTAL DUE: ${totalDue.toString()}`,
        ],
        {},
      )
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })
      await BluetoothEscposPrinter.printText("\n", {})

      // if (receiptSettings?.on_off_flag3 === "Y") {
      //     await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
      //     await BluetoothEscposPrinter.printText("\n", {})
      // }
      // if (receiptSettings?.on_off_flag4 === "Y") {
      //     await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
      // }
      // await BluetoothEscposPrinter.printText("\n", {})

      // await BluetoothEscposPrinter.printText(
      //     "THANK YOU, VISIT AGAIN!",
      //     { align: "center" },
      // )

      // await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------X------", {})
      await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
    } catch (e) {
      console.log(e.message || "ERROR")
    }
  }

  async function printRecoveryReport(
    recoveryReport: RecoveryReportData[],
    fromDate: string,
    toDate: string,
  ) {
    const loginStore = JSON.parse(loginStorage.getString("login-data"))
    const fileStore = fileStorage.getString("comp_picture")

    const shopName: string = loginStore?.company_name?.toString()
    const address: string = loginStore?.address?.toString()
    const location: string = loginStore?.branch_name?.toString()
    const shopMobile: string = loginStore?.phone_no?.toString()
    const shopEmail: string = loginStore?.email_id?.toString()
    // const cashier: string = loginStore?.user_name?.toString()

    let totalNet: number = 0
    let totalDue: number = 0

    try {
      let columnWidths = [11, 1, 18]
      let columnWidthsHeader = [8, 1, 21]
      // let columnWidthsProductsHeaderAndBody = [5, 4, 7, 6, 6, 4] // 0 in hand
      let columnWidthsProductsHeaderAndBody = [11, 8, 6, 7] // 0 in hand
      // let columnWidthsProductsHeaderAndBody = [18, 3, 4, 3, 4]
      // let columnWidthsTotals = [15, 15]
      let columnWidthsTotals = [32]
      let columnWidthIfNameIsBig = [32]

      // let newColumnWidths: number[] = [9, 9, 6, 7]

      if (fileStore?.length > 0) {
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        const options = {
          width: 250, // Assuming 58mm paper width with 8 dots/mm resolution (58mm * 8dots/mm = 384 dots)
          left: 50, // No left padding
          // align: "CENTER"
        }

        // Print the image
        if (receiptSettings?.logo_flag == 'Y')
          await BluetoothEscposPrinter.printPic(fileStore, options)
      }

      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.CENTER,
      )
      await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
        align: "center",
        widthtimes: 1.2,
        heigthtimes: 2,
      })
      await BluetoothEscposPrinter.printText("\n", {})


      // await BluetoothEscposPrinter.printText("hasifughaf", { align: "center" })

      // if (receiptSettings?.on_off_flag1 === "Y") {
      //     await BluetoothEscposPrinter.printText(receiptSettings?.header1, {})
      //     await BluetoothEscposPrinter.printText("\n", {})
      // }

      // if (receiptSettings?.on_off_flag2 === "Y") {
      //     await BluetoothEscposPrinter.printText(receiptSettings?.header2, {})
      // }
      // await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("RECOVERY REPORT", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})

      await BluetoothEscposPrinter.printText(
        `From: ${new Date(fromDate).toLocaleDateString(
          "en-GB",
        )}  To: ${new Date(toDate).toLocaleDateString("en-GB")}`,
        {},
      )

      await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      // await BluetoothEscposPrinter.printText("\n", {})
      // await BluetoothEscposPrinter.printText(address, {
      //   align: "center",
      // })
      // await BluetoothEscposPrinter.printText("\n", {})
      // await BluetoothEscposPrinter.printText(location, {
      //   align: "center",
      // })
      // await BluetoothEscposPrinter.printText("\n", {})

      // await BluetoothEscposPrinter.printText("------------------------", {
      //   align: "center",
      // })
      await BluetoothEscposPrinter.printText("\n", {})

      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.CENTER,
      )

      await BluetoothEscposPrinter.printColumn(
        columnWidthsProductsHeaderAndBody,
        [
          // BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.RIGHT,
          BluetoothEscposPrinter.ALIGN.RIGHT,
          // BluetoothEscposPrinter.ALIGN.RIGHT,
        ],
        ["R. DT.", "NAME", "PHONE", "R. AMT"],
        {},
      )
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})

      let totalRecover = 0
      for (const item of recoveryReport) {
        totalRecover += item?.recovery_amt

        await BluetoothEscposPrinter.printColumn(
          columnWidthsProductsHeaderAndBody,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            item?.recover_dt,
            item?.cust_name,
            item?.phone_no,
            item?.recovery_amt?.toString(),
          ],
          {},
        )
      }

      // await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})

      await BluetoothEscposPrinter.printColumn(
        columnWidthsTotals,
        [BluetoothEscposPrinter.ALIGN.CENTER],
        [
          `TOTAL RECOVER: ${totalRecover.toString()}`,
        ],
        {},
      )

      // await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      // await BluetoothEscposPrinter.printText("\n", {})

      // if (receiptSettings?.on_off_flag3 === "Y") {
      //     await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
      //     await BluetoothEscposPrinter.printText("\n", {})
      // }
      // if (receiptSettings?.on_off_flag4 === "Y") {
      //     await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
      // }
      // await BluetoothEscposPrinter.printText("\n", {})

      // await BluetoothEscposPrinter.printText(
      //     "THANK YOU, VISIT AGAIN!",
      //     { align: "center" },
      // )

      await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------X------", {})
      await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
    } catch (e) {
      console.log(e.message || "ERROR")
    }
  }


  async function printBillCalculateMode(receiptNumber: number, bill: Bill[], totalQty: number, totalPrice: number) {
    const loginStore = JSON.parse(loginStorage.getString("login-data"))
    const fileStore = fileStorage.getString("comp_picture")

    const shopName: string = loginStore?.company_name?.toString()

    try {
      if (receiptSettings?.print_op === '1' || receiptSettings?.print_op === '2') {
        let columnWidths = [11, 1, 18]
        let columnWidthsHeader = [8, 1, 21]
        // let columnWidthsProductsHeaderAndBody = [5, 4, 8, 6, 4, 4] // 1 in hand
        // let columnWidthsProductsHeaderAndBody = [5, 5, 5, 8, 8] // 1 in hand
        let columnWidthsProductsHeaderAndBody = [8, 7, 7, 8] // 2 in hand
        // let columnWidthsProductsHeaderAndBody = [19, 9] // 2 in hand
        // let columnWidthsProductsHeaderAndBody = [18, 3, 4, 3, 4]
        let columnWidthsTotals = [15, 15]
        let columnWidthIfNameIsBig = [32]

        // let newColumnWidths: number[] = [9, 9, 6, 7]

        if (fileStore?.length > 0) {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          const options = {
            width: 250, // Assuming 58mm paper width with 8 dots/mm resolution (58mm * 8dots/mm = 384 dots)
            left: 50, // No left padding
            // align: "CENTER"
          }

          // Print the image
          const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
            ? fileStore.split("data:application/octet-stream;base64,")[1]

            : fileStore
          console.log(pureBase64, 'purbase64 er indicator dao reprint!')
          if (receiptSettings?.logo_flag == 'Y')
            await BluetoothEscposPrinter.printPic(pureBase64, options)
          // await BluetoothEscposPrinter.printPic(fileStore, options)
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
          align: "center",
          widthtimes: 1.2,
          heigthtimes: 2,
        })
        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        if (receiptSettings?.on_off_flag1 === "Y") {
          await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

          await BluetoothEscposPrinter.printText(receiptSettings?.header1, { align: "center", })
          await BluetoothEscposPrinter.printText("\n", {})
        }

        if (receiptSettings?.on_off_flag2 === "Y") {
          await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

          await BluetoothEscposPrinter.printText(receiptSettings?.header2, { align: "center", })
          await BluetoothEscposPrinter.printText("\n", {})

        }
        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("RECEIPT", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printColumn(
          columnWidthsTotals,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["RCPT. NO.", `${receiptNumber?.toString()}`],
          {},
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsTotals,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["DATE", `${new Date().toLocaleString("en-GB")}`],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsProductsHeaderAndBody,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["S NO.", "QTY", "RATE", "AMOUNT"],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        for (const item of bill) {
          await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              `${item?.id?.toString()}`, `${item?.qty?.toString()}`,
              `${item?.price?.toString()}`, `${item?.total?.toString()}`,
            ],
            {},
          )
        }
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printColumn(
          columnWidthsTotals,
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
          [
            `QTY: ${totalQty?.toString()}`,
            `NET: ${totalPrice?.toString()}`,
          ],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidthsTotals,
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
          [
            `GRAND: ${(totalPrice + parseFloat(roundingOffCalculate(totalPrice, 0)))?.toFixed(2)}`,
            `ROUND: ${roundingOffCalculate(totalPrice, 0)}`,
          ],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        // await BluetoothEscposPrinter.printText("\n", {})
        // if (receiptSettings?.on_off_flag3 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
        //     await BluetoothEscposPrinter.printText("\n", {})
        // }
        // if (receiptSettings?.on_off_flag4 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
        // }
        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText(
        //     "THANK YOU, VISIT AGAIN!",
        //     { align: "center" },
        // )
        if (receiptSettings?.on_off_flag3 === "Y") {
          await BluetoothEscposPrinter.printText("\n", {})

          await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

          await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
          await BluetoothEscposPrinter.printText("\n", {})
        }
        if (receiptSettings?.on_off_flag4 === "Y") {
          await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

          await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
        }
        await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText(
        //     "THANK YOU, VISIT AGAIN!",
        //     { align: "center" },
        // )
        // await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------X------", {})
        await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
      } else if (receiptSettings?.print_op === '3') {
        let columnWidths = [11, 1, 18]
        let columnWidthsHeader = [8, 1, 21]
        // let columnWidthsProductsHeaderAndBody = [5, 4, 8, 6, 4, 4] // 1 in hand
        // let columnWidthsProductsHeaderAndBody = [5, 5, 5, 8, 8] // 1 in hand
        let columnWidthsProductsHeaderAndBody = [8, 7, 7, 8] // 2 in hand
        // let columnWidthsProductsHeaderAndBody = [19, 9] // 2 in hand
        // let columnWidthsProductsHeaderAndBody = [18, 3, 4, 3, 4]
        let columnWidthsTotals = [15, 15]
        let columnWidthIfNameIsBig = [32]

        // let newColumnWidths: number[] = [9, 9, 6, 7]

        if (fileStore?.length > 0) {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          const options = {
            width: 250, // Assuming 58mm paper width with 8 dots/mm resolution (58mm * 8dots/mm = 384 dots)
            left: 50, // No left padding
            // align: "CENTER"
          }

          // Print the image
          const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
            ? fileStore.split("data:application/octet-stream;base64,")[1]

            : fileStore
          console.log(pureBase64, 'purbase64 er indicator dao reprint!')
          if (receiptSettings?.logo_flag == 'Y')
            await BluetoothEscposPrinter.printPic(pureBase64, options)
          // await BluetoothEscposPrinter.printPic(fileStore, options)
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
          align: "center",
          widthtimes: 1.2,
          heigthtimes: 2,
        })
        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        if (receiptSettings?.on_off_flag1 === "Y") {
          await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

          await BluetoothEscposPrinter.printText(receiptSettings?.header1, { align: "center", })
          await BluetoothEscposPrinter.printText("\n", {})
        }

        if (receiptSettings?.on_off_flag2 === "Y") {
          await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

          await BluetoothEscposPrinter.printText(receiptSettings?.header2, { align: "center", })
          await BluetoothEscposPrinter.printText("\n", {})

        }
        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })
        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("RECEIPT", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printColumn(
          columnWidthsTotals,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["RCPT. NO.", `${receiptNumber?.toString()}`],
          {},
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsTotals,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["DATE", `${new Date().toLocaleString("en-GB")}`],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsProductsHeaderAndBody,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["S NO.", "QTY", "RATE", "AMOUNT"],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        for (const item of bill) {
          await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              `${item?.id?.toString()}`, `${item?.qty?.toString()}`,
              `${item?.price?.toString()}`, `${item?.total?.toString()}`,
            ],
            {},
          )
        }
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printColumn(
          columnWidthsTotals,
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
          [
            `QTY: ${totalQty?.toString()}`,
            `NET: ${totalPrice?.toString()}`,
          ],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidthsTotals,
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
          [
            `GRAND: ${(totalPrice + parseFloat(roundingOffCalculate(totalPrice, 0)))?.toFixed(2)}`,
            `ROUND: ${roundingOffCalculate(totalPrice, 0)}`,
          ],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        // await BluetoothEscposPrinter.printText("\n", {})
        // if (receiptSettings?.on_off_flag3 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
        //     await BluetoothEscposPrinter.printText("\n", {})
        // }
        // if (receiptSettings?.on_off_flag4 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
        // }
        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText(
        //     "THANK YOU, VISIT AGAIN!",
        //     { align: "center" },
        // )
        if (receiptSettings?.on_off_flag3 === "Y") {
          await BluetoothEscposPrinter.printText("\n", {})

          await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

          await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
          await BluetoothEscposPrinter.printText("\n", {})
        }
        if (receiptSettings?.on_off_flag4 === "Y") {
          await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

          await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
        }
        await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText(
        //     "THANK YOU, VISIT AGAIN!",
        //     { align: "center" },
        // )
        // await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------X------", {})
        await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
      }
    } catch (e) {
      console.log(e.message || "ERROR")
    }
  }

  async function printDuplicateBillCalculateMode(bill: CalculatorShowBillData[]) {
    const loginStore = JSON.parse(loginStorage.getString("login-data"))
    const fileStore = fileStorage.getString("comp_picture")

    const shopName: string = loginStore?.company_name?.toString()

    try {
      if (receiptSettings?.print_op === '1' || receiptSettings?.print_op === '2') {
        let columnWidths = [11, 1, 18]
        let columnWidthsHeader = [8, 1, 21]
        // let columnWidthsProductsHeaderAndBody = [5, 4, 8, 6, 4, 4] // 1 in hand
        // let columnWidthsProductsHeaderAndBody = [5, 5, 5, 8, 8] // 1 in hand
        let columnWidthsProductsHeaderAndBody = [8, 7, 7, 8] // 2 in hand
        // let columnWidthsProductsHeaderAndBody = [19, 9] // 2 in hand
        // let columnWidthsProductsHeaderAndBody = [18, 3, 4, 3, 4]
        let columnWidthsTotals = [15, 15]
        let columnWidthIfNameIsBig = [32]

        // let newColumnWidths: number[] = [9, 9, 6, 7]

        if (fileStore?.length > 0) {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          const options = {
            width: 250, // Assuming 58mm paper width with 8 dots/mm resolution (58mm * 8dots/mm = 384 dots)
            left: 50, // No left padding
            // align: "CENTER"
          }

          // Print the image
          const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
            ? fileStore.split("data:application/octet-stream;base64,")[1]

            : fileStore
          console.log(pureBase64, 'purbase64 er indicator dao reprint!')
          if (receiptSettings?.logo_flag == 'Y')
            await BluetoothEscposPrinter.printPic(pureBase64, options)
          // await BluetoothEscposPrinter.printPic(fileStore, options)
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
          align: "center",
          widthtimes: 1.2,
          heigthtimes: 2,
        })
        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
        await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText("hasifughaf", { align: "center" })

        if (receiptSettings?.on_off_flag1 === "Y") {
          console.log("printing center")
          await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
          await BluetoothEscposPrinter.printText(receiptSettings?.header1, { align: "center" })
          await BluetoothEscposPrinter.printText("\n", {})
        }

        if (receiptSettings?.on_off_flag2 === "Y") {
          await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

          await BluetoothEscposPrinter.printText(receiptSettings?.header2, { align: "center" })
        }
        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("DUPLICATE RECEIPT", {
          align: "center",
        })
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printColumn(
          columnWidthsTotals,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["RCPT. NO.", `${bill[0]?.receipt_no?.toString()}`],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsProductsHeaderAndBody,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["S NO.", "QTY", "RATE", "AMOUNT"],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        let i = 0
        let totalQty = 0
        for (const item of bill) {
          i++
          totalQty += item?.qty
          await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              `${i?.toString()}`, `${item?.qty?.toString()}`,
              `${item?.price?.toString()}`, `${item?.qty * item?.price}`,
            ],
            {},
          )
        }
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printColumn(
          columnWidthsTotals,
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
          [
            `QTY: ${totalQty?.toString()}`,
            `NET: ${bill[0]?.tprice?.toString()}`,
          ],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidthsTotals,
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
          [
            `GRAND: ${bill[0]?.net_amt?.toString()}`,
            `ROUND: ${bill[0]?.round_off?.toString()}`,
          ],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------", {
          align: "center",
        })

        // await BluetoothEscposPrinter.printText("\n", {})
        // if (receiptSettings?.on_off_flag3 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
        //     await BluetoothEscposPrinter.printText("\n", {})
        // }
        // if (receiptSettings?.on_off_flag4 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
        // }
        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText(
        //     "THANK YOU, VISIT AGAIN!",
        //     { align: "center" },
        // )
        await BluetoothEscposPrinter.printText("\n", {})

        if (receiptSettings?.on_off_flag3 === "Y") {
          await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

          await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
          await BluetoothEscposPrinter.printText("\n", {})
        }
        if (receiptSettings?.on_off_flag4 === "Y") {
          await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

          await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
        }
        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------X------", {})
        await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
      } else if (receiptSettings?.print_op === '3') {
        let columnWidths = [11, 1, 18]
        let columnWidthsHeader = [8, 1, 21]
        // let columnWidthsProductsHeaderAndBody = [5, 4, 8, 6, 4, 4] // 1 in hand
        // let columnWidthsProductsHeaderAndBody = [5, 5, 5, 8, 8] // 1 in hand
        let columnWidthsProductsHeaderAndBody = [8, 7, 7, 8] // 2 in hand
        // let columnWidthsProductsHeaderAndBody = [19, 9] // 2 in hand
        // let columnWidthsProductsHeaderAndBody = [18, 3, 4, 3, 4]
        let columnWidthsTotals = [15, 15]
        let columnWidthIfNameIsBig = [32]

        // let newColumnWidths: number[] = [9, 9, 6, 7]

        if (fileStore?.length > 0) {
          await BluetoothEscposPrinter.printerAlign(
            BluetoothEscposPrinter.ALIGN.CENTER,
          )
          const options = {
            width: 250, // Assuming 58mm paper width with 8 dots/mm resolution (58mm * 8dots/mm = 384 dots)
            left: 50, // No left padding
            // align: "CENTER"
          }

          // Print the image
          const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
            ? fileStore.split("data:application/octet-stream;base64,")[1]

            : fileStore
          console.log(pureBase64, 'purbase64 er indicator dao reprint!')
          if (receiptSettings?.logo_flag == 'Y')
            await BluetoothEscposPrinter.printPic(pureBase64, options)
          // await BluetoothEscposPrinter.printPic(fileStore, options)
        }

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
          align: "center",
          widthtimes: 1.2,
          heigthtimes: 2,
        })
        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
        await BluetoothEscposPrinter.printText("\n", {})
        // await BluetoothEscposPrinter.printText("hasifughaf", { align: "center" })

        if (receiptSettings?.on_off_flag1 === "Y") {
          console.log("printing center")
          await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
          await BluetoothEscposPrinter.printText(receiptSettings?.header1, { align: "center" })
          await BluetoothEscposPrinter.printText("\n", {})
        }

        if (receiptSettings?.on_off_flag2 === "Y") {
          await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

          await BluetoothEscposPrinter.printText(receiptSettings?.header2, { align: "center" })
        }
        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("DUPLICATE RECEIPT", {
          align: "center",
        })
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printColumn(
          columnWidthsTotals,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["RCPT. NO.", `${bill[0]?.receipt_no?.toString()}`],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        await BluetoothEscposPrinter.printColumn(
          columnWidthsProductsHeaderAndBody,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["S NO.", "QTY", "RATE", "AMOUNT"],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        let i = 0
        let totalQty = 0
        for (const item of bill) {
          i++
          totalQty += item?.qty
          await BluetoothEscposPrinter.printColumn(
            columnWidthsProductsHeaderAndBody,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            [
              `${i?.toString()}`, `${item?.qty?.toString()}`,
              `${item?.price?.toString()}`, `${item?.qty * item?.price}`,
            ],
            {},
          )
        }
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        await BluetoothEscposPrinter.printText("\n", {})

        await BluetoothEscposPrinter.printColumn(
          columnWidthsTotals,
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
          [
            `QTY: ${totalQty?.toString()}`,
            `NET: ${bill[0]?.tprice?.toString()}`,
          ],
          {},
        )

        await BluetoothEscposPrinter.printColumn(
          columnWidthsTotals,
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
          [
            `GRAND: ${bill[0]?.net_amt?.toString()}`,
            `ROUND: ${bill[0]?.round_off?.toString()}`,
          ],
          {},
        )
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------------------------------------------------", {
          align: "center",
        })

        // await BluetoothEscposPrinter.printText("\n", {})
        // if (receiptSettings?.on_off_flag3 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
        //     await BluetoothEscposPrinter.printText("\n", {})
        // }
        // if (receiptSettings?.on_off_flag4 === "Y") {
        //     await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
        // }
        // await BluetoothEscposPrinter.printText("\n", {})

        // await BluetoothEscposPrinter.printText(
        //     "THANK YOU, VISIT AGAIN!",
        //     { align: "center" },
        // )
        await BluetoothEscposPrinter.printText("\n", {})

        if (receiptSettings?.on_off_flag3 === "Y") {
          await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

          await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
          await BluetoothEscposPrinter.printText("\n", {})
        }
        if (receiptSettings?.on_off_flag4 === "Y") {
          await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

          await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
        }
        await BluetoothEscposPrinter.printText("\n", {})
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        await BluetoothEscposPrinter.printText("------X------", {})
        await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
      }
    } catch (e) {
      console.log(e.message || "ERROR")
    }
  }

  async function printSaleReportCalculateMode(report: SaleReportCalculateModeData[], fromDate: string, toDate: string) {
    const loginStore = JSON.parse(loginStorage.getString("login-data"))
    const fileStore = fileStorage.getString("comp_picture")

    const shopName: string = loginStore?.company_name?.toString()

    try {
      let columnWidths = [11, 1, 18]
      let columnWidthsHeader = [8, 1, 21]
      // let columnWidthsProductsHeaderAndBody = [5, 4, 8, 6, 4, 4] // 1 in hand
      // let columnWidthsProductsHeaderAndBody = [5, 5, 5, 8, 8] // 1 in hand
      let columnWidthsProductsHeaderAndBody = [8, 7, 7, 8] // 2 in hand
      // let columnWidthsProductsHeaderAndBody = [19, 9] // 2 in hand
      // let columnWidthsProductsHeaderAndBody = [18, 3, 4, 3, 4]
      let columnWidthsTotals = [15, 15]
      let columnWidthIfNameIsBig = [32]

      // let newColumnWidths: number[] = [9, 9, 6, 7]

      if (fileStore?.length > 0) {
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        const options = {
          width: 250, // Assuming 58mm paper width with 8 dots/mm resolution (58mm * 8dots/mm = 384 dots)
          left: 50, // No left padding
          // align: "CENTER"
        }

        // Print the image
        const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
          ? fileStore.split("data:application/octet-stream;base64,")[1]

          : fileStore
        console.log(pureBase64, 'purbase64 er indicator dao reprint!')
        if (receiptSettings?.logo_flag == 'Y')
          await BluetoothEscposPrinter.printPic(pureBase64, options)
        // await BluetoothEscposPrinter.printPic(fileStore, options)
      }

      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.CENTER,
      )
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
        align: "center",
        widthtimes: 1.2,
        heigthtimes: 2,
      })
      await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("SALE REPORT", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})

      await BluetoothEscposPrinter.printText(
        `From: ${new Date(fromDate).toLocaleDateString(
          "en-GB",
        )}  To: ${new Date(toDate).toLocaleDateString("en-GB")}`,
        {},
      )

      await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})

      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.CENTER,
      )
      await BluetoothEscposPrinter.printColumn(
        columnWidthsProductsHeaderAndBody,
        [
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.CENTER,
          BluetoothEscposPrinter.ALIGN.CENTER,
          BluetoothEscposPrinter.ALIGN.RIGHT,
        ],
        ["RCPT", "ITEMS", "RATE", "AMOUNT"],
        {},
      )
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})

      let i = 0
      let totalQty = 0
      let totalNet = 0
      for (const item of report) {
        i++
        totalQty += item?.no_of_items
        totalNet += item?.net_amt
        await BluetoothEscposPrinter.printColumn(
          columnWidthsProductsHeaderAndBody,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [
            `${item?.receipt_no
              ?.toString()
              ?.substring(item?.receipt_no?.toString()?.length - 4)}`, `${item?.no_of_items?.toString()}`,
            `${item?.price?.toString()}`, `${item?.net_amt}`,
          ],
          {},
        )
      }
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})

      await BluetoothEscposPrinter.printColumn(
        columnWidthsTotals,
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
        [
          `QTY: ${totalQty?.toString()}`,
          `NET: ${totalNet?.toString()}`,
        ],
        {},
      )
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------X------", {})
      await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
    } catch (e) {
      console.log(e.message || "ERROR")
    }
  }

  async function printRecoveryAmount(recAmt: RecoveryAmountResponseData[]) {
    const loginStore = JSON.parse(loginStorage.getString("login-data"))
    const fileStore = fileStorage.getString("comp_picture")

    const shopName: string = loginStore?.company_name?.toString()
    const address: string = loginStore?.address?.toString()
    const location: string = loginStore?.branch_name?.toString()
    const shopMobile: string = loginStore?.phone_no?.toString()
    const shopEmail: string = loginStore?.email_id?.toString()
    // const cashier: string = loginStore?.user_name?.toString()

    let totalNet: number = 0
    let totalDue: number = 0

    try {
      let columnWidths = [11, 1, 18]
      let columnWidthsHeader = [8, 1, 21]
      // let columnWidthsProductsHeaderAndBody = [5, 4, 7, 6, 6, 4] // 0 in hand
      let columnWidthsProductsHeaderAndBody = [11, 8, 6, 7] // 0 in hand
      // let columnWidthsProductsHeaderAndBody = [18, 3, 4, 3, 4]
      // let columnWidthsTotals = [15, 15]
      let columnWidthsTotals = [32]
      let columnWidthIfNameIsBig = [32]

      // let newColumnWidths: number[] = [9, 9, 6, 7]

      if (fileStore?.length > 0) {
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        const options = {
          width: 250, // Assuming 58mm paper width with 8 dots/mm resolution (58mm * 8dots/mm = 384 dots)
          left: 50, // No left padding
          // align: "CENTER"
        }

        // Print the image
        const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
          ? fileStore.split("data:application/octet-stream;base64,")[1]

          : fileStore
        console.log(pureBase64, 'purbase64 er indicator dao reprint!')
        if (receiptSettings?.logo_flag == 'Y')
          await BluetoothEscposPrinter.printPic(pureBase64, options)
        // await BluetoothEscposPrinter.printPic(fileStore, options)
      }

      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.CENTER,
      )
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
        align: "center",
        widthtimes: 1.2,
        heigthtimes: 2,
      })
      await BluetoothEscposPrinter.printText("\n", {})
      // await BluetoothEscposPrinter.printText("hasifughaf", { align: "center" })

      // if (receiptSettings?.on_off_flag1 === "Y") {
      //     await BluetoothEscposPrinter.printText(receiptSettings?.header1, {})
      //     await BluetoothEscposPrinter.printText("\n", {})
      // }

      // if (receiptSettings?.on_off_flag2 === "Y") {
      //     await BluetoothEscposPrinter.printText(receiptSettings?.header2, {})
      // }
      // await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("RECOVERY", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})

      await BluetoothEscposPrinter.printText(
        `DATE: ${new Date().toLocaleDateString(
          "en-GB",
        )}`,
        {},
      )

      await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})

      await BluetoothEscposPrinter.printText(
        `TOTAL PAID: ${recAmt[0]?.paid_amt}`,
        {},
      )

      await BluetoothEscposPrinter.printText("\n", {})

      await BluetoothEscposPrinter.printText(
        `TOTAL DUE: ${recAmt[0]?.net_amt - recAmt[0]?.paid_amt}`,
        {},
      )

      await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      // await BluetoothEscposPrinter.printText("\n", {})

      // if (receiptSettings?.on_off_flag3 === "Y") {
      //     await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
      //     await BluetoothEscposPrinter.printText("\n", {})
      // }
      // if (receiptSettings?.on_off_flag4 === "Y") {
      //     await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
      // }
      // await BluetoothEscposPrinter.printText("\n", {})

      // await BluetoothEscposPrinter.printText(
      //     "THANK YOU, VISIT AGAIN!",
      //     { align: "center" },
      // )

      await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

      await BluetoothEscposPrinter.printText("------X------", {})
      await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
    } catch (e) {
      console.log(e.message || "ERROR")
    }
  }
  async function rePrint(
    addedProducts: ShowBillData[],
    netTotal: number,
    totalDiscountAmount: number,
    cashAmount?: number,
    returnedAmt?: number,
    customerName?: string,
    customerPhone?: string,
    rcptNo?: number,
    paymentMode?: string,
    isRefunded?: boolean,
    isRefundedDuplicate?: boolean,
    cancelFlag?: boolean
  ) {
    console.log(
      "SSSSSSSSSSSSSSSS==================SSSSSSSSSSSSSSSSSS CALLED rePrint",
    )

    const loginStore = JSON.parse(loginStorage.getString("login-data"))
    const fileStore = fileStorage.getString("comp_picture")
    // console.log(BASE_URL_CATEGORY_IMG + fileStore,'14256')

    //  urlToBase64(fileStorage.getString("comp_picture"))
    //   .then(base64 => {
    //     console.log('base64=====', base64); // "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
    //   });

    const shopName: string = loginStore?.company_name?.toString()
    const address: string = loginStore?.address?.toString()
    const location: string = loginStore?.branch_name?.toString()
    const shopMobile: string = loginStore?.phone_no?.toString()
    const shopEmail: string = loginStore?.email_id?.toString()
    const cashier: string = loginStore?.user_name?.toString()

    // let { totalCGST_5, totalCGST_12, totalCGST_18, totalCGST_28, totalSGST_5, totalSGST_12, totalSGST_18, totalSGST_28, totalGST } = gstFilterationAndTotalForRePrint(addedProducts)

    let gstTotals = gstFilterationAndTotalForRePrint(
      addedProducts,
      addedProducts[0]?.gst_type,
    )
    let { totalGST } = gstTotals // Destructure totalGST for separate handling

    // Filter keys for CGST and SGST display
    const gstKeys = Object.keys(gstTotals).filter(
      key => key.includes("totalCGST") || key.includes("totalSGST"),
    )

    let totalQuantities: number = 0
    let totalAmountAfterDiscount: number = 0

    try {
      let columnWidths = [11, 1, 18]
      let columnWidthsHeader = [8, 1, 21]
      let columnWidthsProductsHeaderAndBody = [8, 4, 6, 5, 7]
      let columnWidthsProductsHeaderAndBodyWithoutDiscount = [8, 6, 7, 8]
      // let columnWidthsProductsHeaderAndBody = [18, 3, 4, 3, 4]
      let columnWidthsItemTotal = [18, 12]
      let columnWidthIfNameIsBig = [32]

      // let newColumnWidths: number[] = [9, 9, 6, 7]

      if (fileStore?.length > 0) {
        await BluetoothEscposPrinter.printerAlign(
          BluetoothEscposPrinter.ALIGN.CENTER,
        )
        const options = {
          width: 210, // Assuming 58mm paper width with 8 dots/mm resolution (58mm * 8dots/mm = 384 dots)
          left: 50, // No left padding
          // align: "CENTER"
        }

        // Print the image
        const pureBase64 = fileStore.startsWith("data:image") || fileStore.startsWith("data:application")
          ? fileStore.split("data:application/octet-stream;base64,")[1]

          : fileStore
        console.log(pureBase64, 'purbase64 er indicator dao reprint!')
        if (receiptSettings?.logo_flag == 'Y')
          await BluetoothEscposPrinter.printPic(pureBase64, options)
        // await BluetoothEscposPrinter.printPic(fileStore, options)
      }

      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.CENTER,
      )
      await BluetoothEscposPrinter.printText(shopName.toUpperCase(), {
        align: "center",
        widthtimes: 1.2,
        heigthtimes: 2,
      })
      await BluetoothEscposPrinter.printText("\n", {})
      // await BluetoothEscposPrinter.printText("hasifughaf", { align: "center" })

      if (receiptSettings?.on_off_flag1 === "Y") {
        await BluetoothEscposPrinter.printText(receiptSettings?.header1, { align: "center" })
        await BluetoothEscposPrinter.printText("\n", {})
      }

      if (receiptSettings?.on_off_flag2 === "Y") {
        await BluetoothEscposPrinter.printText(receiptSettings?.header2, { align: "center" })
      }
      await BluetoothEscposPrinter.printText("\n", {})

      if (!cancelFlag) {
        !isRefunded
          ? await BluetoothEscposPrinter.printText("DUPLICATE RECEIPT", {
            align: "center",
          })
          : !isRefundedDuplicate
            ? await BluetoothEscposPrinter.printText("REFUND RECEIPT", {
              align: "center",
            })
            : await BluetoothEscposPrinter.printText("DUPLICATE REFUND RECEIPT", {
              align: "center",
            })
      }

      cancelFlag
        && await BluetoothEscposPrinter.printText("CANCELLED BILL", {
          align: "center",
        })

      // await BluetoothEscposPrinter.printText("\n", {})

      // await BluetoothEscposPrinter.printText("------------------------", {
      //   align: "center",
      // })

      // await BluetoothEscposPrinter.printText("\n", {})
      // await BluetoothEscposPrinter.printText(address, {
      //   align: "center",
      // })
      // await BluetoothEscposPrinter.printText("\n", {})
      // await BluetoothEscposPrinter.printText(location, {
      //   align: "center",
      // })
      await BluetoothEscposPrinter.printText("\n", {})
      // await BluetoothEscposPrinter.printText("------------------------", {
      //   align: "center",
      // })
      // await BluetoothEscposPrinter.printText("\n", {})

      // // await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT)

      // await BluetoothEscposPrinter.printColumn(
      //   columnWidthsHeader,
      //   [
      //     BluetoothEscposPrinter.ALIGN.LEFT,
      //     BluetoothEscposPrinter.ALIGN.CENTER,
      //     BluetoothEscposPrinter.ALIGN.RIGHT,
      //   ],
      //   ["MOBILE", ":", shopMobile],
      //   {},
      // )
      // await BluetoothEscposPrinter.printColumn(
      //   columnWidthsHeader,
      //   [
      //     BluetoothEscposPrinter.ALIGN.LEFT,
      //     BluetoothEscposPrinter.ALIGN.CENTER,
      //     BluetoothEscposPrinter.ALIGN.RIGHT,
      //   ],
      //   ["EMAIL", ":", shopEmail],
      //   {},
      // )
      // await BluetoothEscposPrinter.printColumn(
      //     columnWidthsHeader,
      //     [
      //         BluetoothEscposPrinter.ALIGN.LEFT,
      //         BluetoothEscposPrinter.ALIGN.CENTER,
      //         BluetoothEscposPrinter.ALIGN.RIGHT,
      //     ],
      //     ["SITE", ":", "SHOPNAME.COM"],
      //     {},
      // )

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })
      await BluetoothEscposPrinter.printText("\n", {})

      await BluetoothEscposPrinter.printColumn(
        columnWidthsHeader,
        [
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.CENTER,
          BluetoothEscposPrinter.ALIGN.RIGHT,
        ],
        ["RCPT.NO", ":", rcptNo?.toString()],
        {},
      )
      await BluetoothEscposPrinter.printColumn(
        columnWidthsHeader,
        [
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.CENTER,
          BluetoothEscposPrinter.ALIGN.RIGHT,
        ],
        ["DATE", ":", `${new Date().toLocaleString("en-GB")}`],
        {},
      )
      await BluetoothEscposPrinter.printColumn(
        columnWidthsHeader,
        [
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.CENTER,
          BluetoothEscposPrinter.ALIGN.RIGHT,
        ],
        ["CASHIER", ":", cashier],
        {},
      )

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })
      await BluetoothEscposPrinter.printText("\n", {})

      if (customerName.length !== 0 || customerPhone.length !== 0) {
        receiptSettings?.cust_inf === "Y" &&
          (await BluetoothEscposPrinter.printColumn(
            columnWidthsHeader,
            [
              BluetoothEscposPrinter.ALIGN.LEFT,
              BluetoothEscposPrinter.ALIGN.CENTER,
              BluetoothEscposPrinter.ALIGN.RIGHT,
            ],
            ["NAME", ":", customerName],
            {},
          ))
        // await BluetoothEscposPrinter.printColumn(
        //   columnWidthsHeader,
        //   [
        //     BluetoothEscposPrinter.ALIGN.LEFT,
        //     BluetoothEscposPrinter.ALIGN.CENTER,
        //     BluetoothEscposPrinter.ALIGN.RIGHT,
        //   ],
        //   ["PHONE", ":", customerPhone],
        //   {},
        // )
      }

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})

      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.CENTER,
      )

      addedProducts[0]?.discount_flag === "Y" &&
        addedProducts[0]?.discount_position !== "B"
        ? await BluetoothEscposPrinter.printColumn(
          columnWidthsProductsHeaderAndBody,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["ITEM", "QTY", "MRP", "DIS.", "TOT AMT"],
          {},
        )
        : await BluetoothEscposPrinter.printColumn(
          columnWidthsProductsHeaderAndBodyWithoutDiscount,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["ITEM", "QTY", "MRP", "TOT AMT"],
          {},
        )

      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})

      for (const item of addedProducts) {
        //@ts-ignore
        totalQuantities += parseInt(item?.qty)
        let discountType: "P" | "A" = addedProducts[0]?.discount_type
        let discountFlag: "N" | "Y" = addedProducts[0]?.discount_flag
        let discountPosition: "B" | "I" = addedProducts[0]?.discount_position

        // discountType === "P"
        //     ? totalAmountAfterDiscount += ((item?.price * item?.qty) - ((item?.price * item?.qty * item?.dis_pertg) / 100))
        //     : totalAmountAfterDiscount += ((item?.price * item?.qty) - (item?.qty * item?.discount_amt))

        if (item?.item_name?.length >= 8) {
          await BluetoothEscposPrinter.printColumn(
            columnWidthIfNameIsBig,
            [BluetoothEscposPrinter.ALIGN.LEFT],
            [item?.item_name],
            {},
          )

          discountFlag === "Y" && discountPosition !== "B"
            ? discountType === "P"
              ? await BluetoothEscposPrinter.printColumn(
                columnWidthsProductsHeaderAndBody,
                [
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.CENTER,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                ],
                //@ts-ignore
                [
                  "",
                  item?.qty.toString(),
                  item?.price.toString(),
                  calculatePercentDiscountPerProduct(
                    item?.price,
                    item?.qty,
                    item?.dis_pertg,
                  ),
                  calculateAmountAfterPercentDiscountPerProduct(
                    item?.price,
                    item?.qty,
                    item?.dis_pertg,
                  ),
                ],
                {},
              )
              : await BluetoothEscposPrinter.printColumn(
                columnWidthsProductsHeaderAndBody,
                [
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.CENTER,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                ],
                //@ts-ignore
                [
                  "",
                  item?.qty.toString(),
                  item?.price.toString(),
                  calculateAmountDiscountPerProduct(
                    item?.qty,
                    item?.discount_amt,
                  ),
                  calculateAmountAfterAmountDiscountPerProduct(
                    item?.price,
                    item?.qty,
                    item?.discount_amt,
                  ),
                ],
                {},
              )
            : await BluetoothEscposPrinter.printColumn(
              columnWidthsProductsHeaderAndBodyWithoutDiscount,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              //@ts-ignore
              [
                "",
                item?.qty.toString(),
                item?.price.toString(),
                calculateAmountAfterAmountDiscountPerProduct(
                  item?.price,
                  item?.qty,
                  0,
                ),
              ],
              {},
            )
          // : await BluetoothEscposPrinter.printColumn(
          //     columnWidthsProductsHeaderAndBody,
          //     [
          //         BluetoothEscposPrinter.ALIGN.LEFT,
          //         BluetoothEscposPrinter.ALIGN.LEFT,
          //         BluetoothEscposPrinter.ALIGN.CENTER,
          //         BluetoothEscposPrinter.ALIGN.RIGHT,
          //         BluetoothEscposPrinter.ALIGN.RIGHT,
          //     ],
          //     //@ts-ignore
          //     ["", item?.qty.toString(), item?.price.toString(), calculateAmountDiscountPerProduct(item?.qty, 0), calculateAmountAfterAmountDiscountPerProduct(item?.price, item?.qty, 0)],
          //     {},
          // )

          // await BluetoothEscposPrinter.printColumn(
          //     columnWidthsProductsHeaderAndBody,
          //     [
          //         BluetoothEscposPrinter.ALIGN.LEFT,
          //         BluetoothEscposPrinter.ALIGN.LEFT,
          //         BluetoothEscposPrinter.ALIGN.CENTER,
          //         BluetoothEscposPrinter.ALIGN.RIGHT,
          //         BluetoothEscposPrinter.ALIGN.RIGHT,
          //     ],
          //     ["", item?.qty.toString(), item?.price.toString(), (((item?.price * item?.qty * item?.dis_pertg) / 100).toFixed(2)).toString(), `${((item?.price * item?.qty) - ((item?.price * item?.qty * item?.dis_pertg) / 100)).toFixed(2).toString()}`],
          //     {},
          // )
        } else {
          discountFlag === "Y" && discountPosition !== "B"
            ? discountType === "P"
              ? await BluetoothEscposPrinter.printColumn(
                columnWidthsProductsHeaderAndBody,
                [
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.CENTER,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                ],
                //@ts-ignore
                [
                  item?.item_name,
                  item?.qty.toString(),
                  item?.price.toString(),
                  calculatePercentDiscountPerProduct(
                    item?.price,
                    item?.qty,
                    item?.dis_pertg,
                  ),
                  calculateAmountAfterPercentDiscountPerProduct(
                    item?.price,
                    item?.qty,
                    item?.dis_pertg,
                  ),
                ],
                {},
              )
              : await BluetoothEscposPrinter.printColumn(
                columnWidthsProductsHeaderAndBody,
                [
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.LEFT,
                  BluetoothEscposPrinter.ALIGN.CENTER,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                  BluetoothEscposPrinter.ALIGN.RIGHT,
                ],
                //@ts-ignore
                [
                  item?.item_name,
                  item?.qty.toString(),
                  item?.price.toString(),
                  calculateAmountDiscountPerProduct(
                    item?.qty,
                    item?.discount_amt,
                  ),
                  calculateAmountAfterAmountDiscountPerProduct(
                    item?.price,
                    item?.qty,
                    item?.discount_amt,
                  ),
                ],
                {},
              )
            : await BluetoothEscposPrinter.printColumn(
              columnWidthsProductsHeaderAndBodyWithoutDiscount,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              //@ts-ignore
              [
                item?.item_name,
                item?.qty.toString(),
                item?.price.toString(),
                calculateAmountAfterAmountDiscountPerProduct(
                  item?.price,
                  item?.qty,
                  0,
                ),
              ],
              {},
            )
          // : await BluetoothEscposPrinter.printColumn(
          //     columnWidthsProductsHeaderAndBody,
          //     [
          //         BluetoothEscposPrinter.ALIGN.LEFT,
          //         BluetoothEscposPrinter.ALIGN.LEFT,
          //         BluetoothEscposPrinter.ALIGN.CENTER,
          //         BluetoothEscposPrinter.ALIGN.RIGHT,
          //         BluetoothEscposPrinter.ALIGN.RIGHT,
          //     ],
          //     //@ts-ignore
          //     [item?.item_name, item?.qty.toString(), item?.price.toString(), calculateAmountDiscountPerProduct(item?.qty, 0), calculateAmountAfterAmountDiscountPerProduct(item?.price, item?.qty, 0)],
          //     {},
          // )

          // await BluetoothEscposPrinter.printColumn(
          //     columnWidthsProductsHeaderAndBody,
          //     [
          //         BluetoothEscposPrinter.ALIGN.LEFT,
          //         BluetoothEscposPrinter.ALIGN.LEFT,
          //         BluetoothEscposPrinter.ALIGN.CENTER,
          //         BluetoothEscposPrinter.ALIGN.RIGHT,
          //         BluetoothEscposPrinter.ALIGN.RIGHT,
          //     ],
          //     [item?.item_name, item?.qty.toString(), item?.price.toString(), (((item?.price * item?.qty * item?.dis_pertg) / 100).toFixed(2)).toString(), `${(item?.price * item?.qty).toString()}`],
          //     {},
          // )
          // await BluetoothEscposPrinter.printText("\n", {})
        }
      }

      // await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })

      await BluetoothEscposPrinter.printText("\n", {})

      await BluetoothEscposPrinter.printColumn(
        columnWidthsItemTotal,
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
        [
          `ITEM: ${addedProducts?.length?.toString()} QTY: ${totalQuantities.toString()}`,
          `AMT: ${netTotal?.toFixed(2)}`,
        ],
        {},
      )
      // await BluetoothEscposPrinter.printText("\n", {})

      // addedProducts[0]?.gst_type === "E"
      //     ? await BluetoothEscposPrinter.printColumn(
      //         columnWidths,
      //         [
      //             BluetoothEscposPrinter.ALIGN.LEFT,
      //             BluetoothEscposPrinter.ALIGN.CENTER,
      //             BluetoothEscposPrinter.ALIGN.RIGHT,
      //         ],
      //         // ["TOTAL", ":", `${(netTotal - totalDiscountAmount + totalGST).toFixed(2)}`],
      //         ["TOTAL", ":", `${netTotalWithGSTCalculate(netTotal, totalDiscountAmount, totalGST)}`],
      //         {},
      //     )
      //     : await BluetoothEscposPrinter.printColumn(
      //         columnWidths,
      //         [
      //             BluetoothEscposPrinter.ALIGN.LEFT,
      //             BluetoothEscposPrinter.ALIGN.CENTER,
      //             BluetoothEscposPrinter.ALIGN.RIGHT,
      //         ],
      //         // ["TOTAL", ":", `${(netTotal - totalDiscountAmount + totalGST).toFixed(2)}`],
      //         ["TOTAL", ":", `${totalAmountWithGSTInclCalculate(netTotal, totalGST)}`],
      //         {},
      //     )

      // addedProducts[0]?.gst_type === "I" &&
      //     await BluetoothEscposPrinter.printColumn(
      //         columnWidths,
      //         [
      //             BluetoothEscposPrinter.ALIGN.LEFT,
      //             BluetoothEscposPrinter.ALIGN.CENTER,
      //             BluetoothEscposPrinter.ALIGN.RIGHT,
      //         ],
      //         // ["TOTAL", ":", `${(netTotal - totalDiscountAmount + totalGST).toFixed(2)}`],
      //         ["TOTAL (Excl GST)", ":", `${totalAmountWithGSTInclCalculate(netTotal, totalGST)}`],
      //         {},
      //     )

      addedProducts[0]?.gst_flag === "Y" &&
        gstKeys.map(
          async key =>
            await BluetoothEscposPrinter.printColumn(
              columnWidths,
              [
                BluetoothEscposPrinter.ALIGN.LEFT,
                BluetoothEscposPrinter.ALIGN.CENTER,
                BluetoothEscposPrinter.ALIGN.RIGHT,
              ],
              [
                `${key.includes("CGST") ? "CGST" : "SGST"} @${key
                  .replace(/total(CGST|SGST)_/, "")
                  .replace("_", ".")}%`,
                ":",
                gstTotals[key].toFixed(2).toString(),
              ],
              {},
            ),
        )

      addedProducts[0]?.gst_flag === "Y" &&
        (await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ["TOTAL GST", ":", totalGST.toFixed(2).toString()],
          {},
        ))

      addedProducts[0]?.discount_flag === "Y" &&
        (await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          //@ts-ignore
          ["DISCOUNT", ":", parseFloat(totalDiscountAmount).toFixed(2)],
          {},
        ))

      addedProducts[0]?.gst_type === "E"
        ? await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          // ["TOTAL", ":", `${(netTotal - totalDiscountAmount + totalGST).toFixed(2)}`],
          [
            "TOTAL",
            ":",
            `${netTotalWithGSTCalculate(
              netTotal,
              totalDiscountAmount,
              totalGST,
            )}`,
          ],
          {},
        )
        : await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          // ["TOTAL", ":", `${(netTotal - totalDiscountAmount + totalGST).toFixed(2)}`],
          [
            "TOTAL",
            ":",
            `${netTotalWithGSTInclCalculate(netTotal, totalDiscountAmount)}`,
          ],
          {},
        )
      // : await BluetoothEscposPrinter.printColumn(
      //     columnWidths,
      //     [
      //         BluetoothEscposPrinter.ALIGN.LEFT,
      //         BluetoothEscposPrinter.ALIGN.CENTER,
      //         BluetoothEscposPrinter.ALIGN.RIGHT,
      //     ],
      //     // ["TOTAL", ":", `${(netTotal - totalDiscountAmount + totalGST).toFixed(2)}`],
      //     ["TOTAL", ":", `${totalAmountWithGSTInclCalculate(netTotal, totalGST)}`],
      //     {},
      // )

      // addedProducts[0]?.gst_flag === "Y"
      //     && await BluetoothEscposPrinter.printColumn(
      //         columnWidths,
      //         [
      //             BluetoothEscposPrinter.ALIGN.LEFT,
      //             BluetoothEscposPrinter.ALIGN.CENTER,
      //             BluetoothEscposPrinter.ALIGN.RIGHT,
      //         ],
      //         ["TOTAL GST", ":", (totalGST).toFixed(2).toString()],
      //         {},
      //     )

      addedProducts[0]?.gst_type === "E"
        ? await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          // ["ROUND OFF", ":", `${(Math.round(parseFloat((netTotal - totalDiscountAmount + totalGST).toFixed(2))) - parseFloat((netTotal - totalDiscountAmount + totalGST).toFixed(2))).toFixed(2)}`],
          [
            "ROUND OFF",
            ":",
            `${roundingOffWithGSTCalculate(
              netTotal,
              totalDiscountAmount,
              totalGST,
            )}`,
          ],
          {},
        )
        : await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          // ["ROUND OFF", ":", `${(Math.round(parseFloat((netTotal - totalDiscountAmount + totalGST).toFixed(2))) - parseFloat((netTotal - totalDiscountAmount + totalGST).toFixed(2))).toFixed(2)}`],
          [
            "ROUND OFF",
            ":",
            `${roundingOffWithGSTInclCalculate(
              netTotal,
              totalDiscountAmount,
            )}`,
          ],
          {},
        )

      // await BluetoothEscposPrinter.printColumn(
      //     columnWidths,
      //     [
      //         BluetoothEscposPrinter.ALIGN.LEFT,
      //         BluetoothEscposPrinter.ALIGN.CENTER,
      //         BluetoothEscposPrinter.ALIGN.RIGHT,
      //     ],
      //     // ["NET AMT", ":", `${Math.round(parseFloat((netTotal - totalDiscountAmount + totalGST).toFixed(2)))}`],
      //     ["NET AMT", ":", `${grandTotalWithGSTCalculate(netTotal, totalDiscountAmount, totalGST)}`],
      //     {},
      // )

      addedProducts[0]?.gst_type === "E"
        ? await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          // ["NET AMT", ":", `${Math.round(parseFloat((netTotal - totalDiscountAmount + totalGST).toFixed(2)))}`],
          [
            "NET AMT",
            ":",
            `${grandTotalWithGSTCalculate(
              netTotal,
              totalDiscountAmount,
              totalGST,
            )}`,
          ],
          {},
        )
        : await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.CENTER,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          // ["NET AMT", ":", `${Math.round(parseFloat((netTotal - totalDiscountAmount + totalGST).toFixed(2)))}`],
          [
            "NET AMT",
            ":",
            `${grandTotalWithGSTInclCalculate(
              netTotal,
              totalDiscountAmount,
            )}`,
          ],
          {},
        )

      // await BluetoothEscposPrinter.printText("\n", {})
      await BluetoothEscposPrinter.printText("------------------------", {
        align: "center",
      })
      !cancelFlag && await BluetoothEscposPrinter.printText("\n", {})

      if (!cancelFlag) {
        if (addedProducts[0]?.rcv_cash_flag === "Y") {
          if (!isRefunded && paymentMode === "C") {
            await BluetoothEscposPrinter.printText("PAYMENT MODE", {
              align: "center",
            })
            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printText(
              `CASH RECEIVED:       ${cashAmount}`,
              { align: "center" },
            )
            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printText(
              `RETURNED AMT:        ${returnedAmt}`,
              { align: "center" },
            )

            await BluetoothEscposPrinter.printText("\n", {})
            await BluetoothEscposPrinter.printText("------------------------", {
              align: "center",
            })
          }
        } else {
          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printText(
            `TOTAL RETURNED AMT:        ${Math.abs(returnedAmt)}`,
            { align: "center" },
          )

          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printText("------------------------", {
            align: "center",
          })
          await BluetoothEscposPrinter.printText("\n", {})
        }
      }


      if (!cancelFlag) {
        await BluetoothEscposPrinter.printText("\n", {})

        if (paymentMode === "R") {
          await BluetoothEscposPrinter.printText("PAYMENT MODE", {
            align: "center",
          })
          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printText(
            `CASH RECEIVED:       ${cashAmount}`,
            { align: "center" },
          )
          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printText(
            `DUE AMT:        ${Math.abs(returnedAmt)}`,
            { align: "center" },
          )

          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printText("------------------------", {
            align: "center",
          })
          await BluetoothEscposPrinter.printText("\n", {})
        }

        if (paymentMode === "D") {
          await BluetoothEscposPrinter.printText(
            `RECEIVED:       ${grandTotalCalculate(
              netTotal,
              totalDiscountAmount,
            )} [CARD]`,
            { align: "center" },
          )
          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printText("------------------------", {
            align: "center",
          })
          await BluetoothEscposPrinter.printText("\n", {})
        }

        if (paymentMode === "U") {
          receiptSettings?.gst_type === "E"
            ? await BluetoothEscposPrinter.printText(
              `RECEIVED:       ${grandTotalWithGSTCalculate(
                netTotal,
                totalDiscountAmount,
                totalGST,
              )} [UPI]`,
              { align: "center" },
            )
            : await BluetoothEscposPrinter.printText(
              `RECEIVED:       ${grandTotalWithGSTInclCalculate(
                netTotal,
                totalDiscountAmount,
              )} [UPI]`,
              { align: "center" },
            )
          await BluetoothEscposPrinter.printText("\n", {})
          await BluetoothEscposPrinter.printText("------------------------", {
            align: "center",
          })
        }
      }



      if (isRefunded)
        addedProducts[0]?.gst_type === "E"
          ? await BluetoothEscposPrinter.printText(
            `REFUNDED AMT:    ${grandTotalWithGSTCalculate(
              netTotal,
              totalDiscountAmount,
              totalGST,
            )}`,
            { align: "center" },
          )
          : await BluetoothEscposPrinter.printText(
            `REFUNDED AMT:    ${grandTotalWithGSTInclCalculate(
              netTotal,
              totalDiscountAmount,
            )}`,
            { align: "center" },
          )
      await BluetoothEscposPrinter.printText("\n", {})

      if (receiptSettings?.on_off_flag3 === "Y") {
        await BluetoothEscposPrinter.printText(receiptSettings?.footer1, {})
        await BluetoothEscposPrinter.printText("\n", {})
      }
      if (receiptSettings?.on_off_flag4 === "Y") {
        await BluetoothEscposPrinter.printText(receiptSettings?.footer2, {})
      }
      await BluetoothEscposPrinter.printText("\n", {})

      // await BluetoothEscposPrinter.printText(
      //     "THANK YOU, VISIT AGAIN!",
      //     { align: "center" },
      // )
      // await BluetoothEscposPrinter.printText("\n", {})

      await BluetoothEscposPrinter.printText("------X------", {})
      await BluetoothEscposPrinter.printText("\n\r\n\r\n\r", {})
    } catch (e) {
      console.log(e.message || "ERROR")
    }
  }

  return {
    printReceipt,
    printReceiptWithoutGst,
    rePrint,
    rePrintWithoutGst,
    printSaleReport,
    printCollectionReport,
    printItemReport,
    printGstStatement,
    printGstSummary,
    printStockReport,
    printUserwiseReport,
    printCancelledBillsReport,
    printRefundReport,
    printCreditReport,
    printRecovery,
    printDaybookReport,
    printDueReport,
    printCustomerLedger,
    printRecoveryReport,
    printBillCalculateMode,
    printDuplicateBillCalculateMode,
    printSaleReportCalculateMode,
    printRecoveryAmount
  }
}
