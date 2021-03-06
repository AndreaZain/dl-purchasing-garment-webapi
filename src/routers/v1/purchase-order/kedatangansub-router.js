var Router = require('restify-router').Router;
var db = require("../../../db");
var Manager = require("dl-module").managers.garmentPurchasing.PurchaseOrderManager;
var resultFormatter = require("../../../result-formatter");
var passport = require('../../../passports/jwt-passport');
const apiVersion = '1.0.0';

function getRouter() {
    var router = new Router();

    router.get('/', passport, (request, response, next) => {
        db.get().then(db => {
           var manager = new Manager(db, request.user);
           var supplier = request.params.supplier;
           var kategori = request.params.kategori;
           var dateFrom = request.params.dateFrom;
           var dateTo = request.params.dateTo;
    
            var offset = request.headers["x-timezone-offset"] ? Number(request.headers["x-timezone-offset"]) : 0;

           manager.getDataTestSub(supplier,dateFrom,dateTo,kategori,offset)
                .then(docs => {
                    if ((request.headers.accept || '').toString().indexOf("application/xls") < 0) {
                        var result = resultFormatter.ok(apiVersion, 200, docs);
                        response.send(200, result);
                    } else {

                        var dateFormat = "DD/MM/YYYY";
                        var dateFormat2 = "DD MMMM YYYY";
                        var locale = 'id-ID';
                        var moment = require('moment');
                        moment.locale(locale);

                        var data = [];
                        var index = 0;
                        for (var purchaseRequest of docs) {
                                index++;
                                var ket='';
            if(purchaseRequest.category =='FABRIC' || purchaseRequest.category =='SUBKON' ){
                   if(purchaseRequest.selisih >=30 ){
                         ket='OK';
                     }else{
                         ket='NOT OK';
                     }
            }else{
                if(purchaseRequest.selisih >=20 ){
                         ket='OK';
                     }else{
                         ket='NOT OK';
                     }
            }
                               var _item = {
                                    "No": index,
                                    "Supplier": purchaseRequest.supplier,
                                    "Plan PO": purchaseRequest.refNo,
                                    "Tgl PR": moment(new Date(purchaseRequest.tglpr)).add(offset, 'h').format(dateFormat),
                                    "Tgl PO Int": moment(new Date(purchaseRequest.tglpo)).add(offset, 'h').format(dateFormat),
                                    "Tgl Pembelian": moment(new Date(purchaseRequest.poeDate)).add(offset, 'h').format(dateFormat),
                                    "Kd Barang": purchaseRequest.productcode,
                                    "Nm Barang": purchaseRequest.productname,
                                    "Ket Barang": purchaseRequest.productdescription,
                                    "Artikel": purchaseRequest.artikel,
                                    "RO": purchaseRequest.roNo,
                                    "Tgl Shipment": moment(new Date(purchaseRequest.purchaseRequestshipmentDate)).add(offset, 'h').format(dateFormat),
                                    "Tgl Datang": moment(new Date(purchaseRequest.tglll)).add(offset, 'h').format(dateFormat),
                                    "+/- Datang": ket,
                                    "Staff": purchaseRequest._createdBy,
                                    
                                }
                                data.push(_item);
                        }

                        var options = {
                            "No": "number",
                            "Supplier": "string",
                            "Plan Po": "string",
                            "Tgl PR": "string",
                            "Tgl PO Int": "string",
                            "Tgl Pembelian": "string",
                            "Kd Barang": "string",
                            "Nm Barang": "string",
                            "Ket Barang": "string",
                            "Artikel": "string",
                            "RO": "string",
                            "Tgl Shipment": "string",
                            "Tgl Datang": "string",
                            "+/- Datang":"string",
                            "Staff": "string",
                        };
                        response.xls(`Monitoring Detail Ketepatan Kedatangan ${kategori} - ${moment(dateFrom).format(dateFormat2)} - ${moment(dateTo).format(dateFormat2)}.xlsx`, data, options);

                    }
                })
                .catch(e => {
                    var error = resultFormatter.fail(apiVersion, 400, e);
                    response.send(400, error);
                })
        })
    });
    return router;
}
module.exports = getRouter;