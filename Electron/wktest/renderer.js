// require modules
var app = require('electron').remote; 
var dialog = app.dialog;
var fs = require('fs');
var FileAPI = require('file-api')
  , File = FileAPI.File
  , FileList = FileAPI.FileList
  , FileReader = FileAPI.FileReader
  ;
var archiver = require('archiver');
var request = require('request');
var opn = require('opn');

var wkserverURL = "http://localhost:9487/testWKHTMLTOPDF";
//var wkserverURL = "http://192.168.7.215:9487/testWKHTMLTOPDF";

var fileDirectory = "";
var preDirectory = "";
var fileName = "";
var targethtml = "";
var targetzip = "";
var resultPDFURI = "";
var zipsize = 0;
var randomnumber = "";
var XPRcorrect = false;
var HTMLcorrect = false;
var message = "";

function openFile () {

	if(resultPDFURI == "")
	{
		selectedFile.innerHTML = "PDF檔尚未產生。";
	}
	else
	{
		selectedFile.innerHTML = "PDF檔位置：" + resultPDFURI;
		opn(resultPDFURI);
	}
}

function selectXPR () {
	XPRcorrect = false;
	fileDirectory = "";
	fileName = "";

	dialog.showOpenDialog(function (fileNames) {
        // fileNames is an array that contains all the selected
       if(fileNames === undefined){
       		selectedFile.innerHTML = "沒有選擇任何檔案。";
       }
       else
       {
	       	var temp = fileNames + ".";				//catch fileNames "string" type
	       	temp = temp.slice(0,temp.length-1);	

	     	fileDirectory = temp.slice(0,temp.lastIndexOf("/")+1);
	     	fileName = temp.slice(temp.lastIndexOf("/")+1,temp.length);
	     	preDirectory = fileDirectory.slice(0,fileDirectory.length-1);
        	preDirectory = preDirectory.slice(0,preDirectory.lastIndexOf("/")+1);
	  //   	selectedFile.innerHTML = fileDirectory + " | " + fileName;

	     	if(fileName.indexOf(".xpr") == -1)
	     		selectedFile.innerHTML = "請選擇.xpr專案檔。";
	     	else if (preDirectory.length < 4) 	//for Windows
	     	{
	     		selectedFile.innerHTML = "偵測到您的專案資料夾位於根目錄，請將資料夾移至它處再重選一次。";
	     	}
	     	else
	     	{
	     		XPRcorrect = true;
	     		showDataLocation();
     		}
       }
	});
}

function selectHTML () {
	HTMLcorrect = false;
	targethtml = "";

	if(XPRcorrect)
	{
		dialog.showOpenDialog(function (fileNames) {
	        // fileNames is an array that contains all the selected
	       if(fileNames === undefined){
	       		selectedFile.innerHTML = "沒有選擇任何檔案。";
	       }
	       else
	       {
		       	var temp = fileNames + ".";				//catch fileNames "string" type
		       	temp = temp.slice(0,temp.length-1);	

		     	if(temp.indexOf(".html") == -1)
		     		selectedFile.innerHTML = "請選擇.html檔。";
		    	else if (temp.indexOf(fileDirectory) == -1) 
		     	{
		     		selectedFile.innerHTML = "偵測到您的.html檔沒有位於您所選擇的專案資料夾，請調整後再進行。";
		     	}
		     	else
		     	{
		      		HTMLcorrect = true;
		      		targethtml = temp.replace(fileDirectory, "");
		     		showDataLocation();
	     		}
	       }
		});
	}
	else
	{
		selectedFile.innerHTML = "請先選擇您的.xpr專案檔。";
	}
}

function showDataLocation () {
	var dataMessage = "專案資料夾：" + fileDirectory + "<br/>";
	dataMessage += "專案檔位置：專案資料夾/" + fileName + "<br/>";
	if(targethtml != "")
		dataMessage += "網頁檔位置：專案資料夾/" + targethtml + "<br/>";
	if(XPRcorrect && HTMLcorrect)
		dataMessage += "檔案設定正確，可進行產生PDF。<br/>";
	selectedFile.innerHTML = dataMessage;
}

function startProcess () {
	if(XPRcorrect && HTMLcorrect)
	{
		message = "";

		var dt = new Date();
       	var tempnumber = Math.floor(Math.random() * (1000000 - 0 + 1)) + 0;
       	randomnumber = dt.getFullYear().toString() + (dt.getMonth()+1).toString() + dt.getDate().toString() + 
       	dt.getHours().toString() + dt.getMinutes().toString() + dt.getSeconds().toString() + 
       	dt.getMilliseconds().toString() + tempnumber;	//make randomnumber

		createZIP();
	//	sendRequest();	//It will be executed when zip file is created.
	}
	else
	{
		selectedFile.innerHTML = "請先順利執行完前兩步驟再來進行此步驟。";
	}
}


function createZIP () {
	message += "產生暫時的專案壓縮檔。<br/>";
	nowStatus.innerHTML = message;
    targetzip = fileName.replace(".xpr", randomnumber + ".zip");

    var output = fs.createWriteStream(preDirectory + targetzip);
    var archive = archiver('zip', {
		store: true // Sets the compression method to STORE.
	});

	// listen for all archive data to be written
	output.on('close', function() {
		zipsize = archive.pointer();
		message += "暫時的壓縮檔已產生完畢。<br/>";
		message += "壓縮檔大小 : " + zipsize + " bytes<br/>";
		nowStatus.innerHTML = message;
		sendRequest();		//next step
	});

	// good practice to catch this error explicitly
	archive.on('error', function(err) {
		message += "Archive ZIP Error : " + err + " bytes<br/>";
		nowStatus.innerHTML = message;
	});

	// pipe archive data to the file
	archive.pipe(output);

	// append files from a directory
	archive.directory(fileDirectory, targetzip.slice(0, targetzip.lastIndexOf(".")));

	// finalize the archive (ie we are done appending files but streams have to finish yet)
	archive.finalize();
}

function sendRequest() {

	message += "傳送渲染請求給WKHTMLTOPDF server。<br/>";
	nowStatus.innerHTML = message;

	var file = fs.createReadStream(preDirectory + targetzip);
	resultPDFURI = preDirectory + fileName.replace(".xpr", ".pdf");

	var formData = {
	    ArchiveName: targetzip,
	    ArchiveSize: zipsize,
	    ArchiveContent: file,
	    HTMLFile: targethtml
	};

  	request.post({url:wkserverURL, formData: formData}, function(err, response, body) {
	    if (err) {
	    	message += "上傳錯誤:" + err + "<br/>";
	    	fs.unlinkSync(preDirectory + targetzip);
    		message += "暫時的專案壓縮檔已刪除。<br/>";
			nowStatus.innerHTML = message;
	    }
	    message += "已上傳請求。" + "<br/>";
		nowStatus.innerHTML = message;
    }).pipe(output = fs.createWriteStream(resultPDFURI));

    output.on('close', function() {		//When the action of making pdf file is finish.
    	fs.unlinkSync(preDirectory + targetzip);
    	message += "暫時的專案壓縮檔已刪除。<br/>";
		message += "已產生PDF檔案。<br/>";
		nowStatus.innerHTML = message;
	});
}
