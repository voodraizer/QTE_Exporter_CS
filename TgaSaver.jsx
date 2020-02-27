// ----------------------------------------------------------------------------------------------------------
// Name: 
//		TGA_saver tool v.1.5
//
// Autor: 
//		voodraizer, 2011-13
//		except Sharpen Inkjet Output, TLR Local Contrast Enhancement (see below).
// Licence:
// 		Any GNU General Public License <http://www.gnu.org/licenses/>.
// ----------------------------------------------------------------------------------------------------------


#target photoshop
//$.level = 0;	// debug level: 0-2 (0:disable, 1:break on error, 2:break at beginning)
//debugger; 	// launch debugger on next line

// -- active document.
var docRef;

// -- active document name.
var docName;

// -- force photoshop to report back pixels
//app.preferences.rulerUnits = Units.PIXELS;

// -- info on the current doc.
var docWidth;
var docHeight;

// -- file name delimiter ( example: <texture_name>_#<version>.psd )
var fileNameDelimiter = "_#";

// -- config files.
var exporterFilename = new File($.fileName);
var exporterFilepath = exporterFilename.parent;

// -- evaluate file.
$.evalFile(exporterFilepath + "/SharpenContrast.jsx");

// ---------------------------------------------------------------------------------------------------------------------
//	Export files. Called from Flex.
// ---------------------------------------------------------------------------------------------------------------------
function ExportFiles(data, slotTemplates)
{
	//$.writeln("-- start export --");

	// -- get the active document.
	docRef = app.activeDocument;
	// -- get the active document name.
	docName = app.activeDocument.name;
	// -- get the info of the current doc.
	docWidth = docRef.width;
	docHeight = docRef.height;
	
	// -- check for errors.
	if (CheckForErrors(data.nonpow2)) return;
	
	// -- delete alpha channels from original psd file.
	RemoveAlphaChannels();
	
	var exportData = data;
	for (var i = 0; i < exportData.textureslots.length; i++)
	{
		//$.writeln("Export: ", exportData.textureslots[i].slot, " ", exportData.textureslots[i].selected);//, " ", exportData.textureslots[i].suffix);
		
		var textureSlot = exportData.textureslots[i];
		if (textureSlot.selected && getByName(docRef.layerSets, textureSlot.slot, false) != null)
		{
			var templateSlot = GetSlotTemplate(slotTemplates, textureSlot.slot);
			if (exportData == null || templateSlot == null) continue;
			
			// -- update progress bar.
			dlg.fp.invokePlayerFunction("UpdateProgressBar", textureSlot.slot, i + 1);
			// -- export.
			SaveExportedTexture(exportData, templateSlot);
		}
	}
	
	//$.writeln("-- end export --");
	
	return 0;
}

// ---------------------------------------------------------------------------------------------------------------------
//	Save file by texture type.
// ---------------------------------------------------------------------------------------------------------------------
function SaveExportedTexture(data, slotTemplate)
{
	// TODO: заменить textureType на textureSlot.
	var textureType = slotTemplate.slot;
	
	var exportPath = docRef.path.fsName;
	var exportName = docRef.name;
	
	// -- delete file extension and suffix.
	exportName = decodeURI(exportName.substring(0, exportName.indexOf(".")));
	var tempStr = decodeURI(exportName.substring(0, exportName.lastIndexOf(fileNameDelimiter)));
	if (tempStr != "") exportName = tempStr;
	
	var suffix = slotTemplate.suffix;
    
    // -- get downscale coefficient.
    var coeff = 1;
	for (i = 0; i < data.downscaleslots.length; i++)
	{
		//$.writeln("Downscale: ", data.downscaleslots[i].slot, " ", data.downscaleslots[i].coeff);
		if (data.downscaleslots[i].slot == textureType) coeff = data.downscaleslots[i].coeff;
	}
	
	// -- create new document.
    var newDoc = docRef.duplicate(exportName + suffix, false);
	app.activeDocument = newDoc;
	
	// -- construct document.
    if ((slotTemplate.fill == undefined) ? true: false)
    {
		//$.writeln("Document from channels");
		ConstructDocumentFromChannels(newDoc, textureType, slotTemplate);
	}
	else
	{
		//$.writeln("Document from group");
		ConstructDocumentFromGroup(newDoc, data, textureType);
	}
	
	// -- flatten document.
	newDoc.flatten();

	// -- downscale if needed.
	DownscaleSize(coeff);

	// -- sharpen.
	if (data.sharpencontrast == true && slotTemplate.allowSharpen == "true")
	{
		SharpenInkjetOutput();
		newDoc.flatten();
		// -- sharpen and contrast.
		SharpenLocalContrast();
		newDoc.flatten();
	}
    
    // -- check if need only export (without save).
    if (data.onlyexport == true)
    {
        // -- make original document active.
        app.activeDocument = docRef;
        return;
	}
    
    // -- save new document
    var saveOptions = null;
    // -- full path with name.
	var saveFile = exportPath + "/" + exportName + suffix;
    var hasAlpha = (newDoc.channels.length == 4) ? true : false;
    //$.writeln("Output: " + data.outputtype);
    if (data.outputtype == "tga")
    {
		saveOptions = CreateTgaSaveOptions(hasAlpha);
	}
	if (data.outputtype == "png")
	{
		saveOptions = CreatePngSaveOptions(hasAlpha);
		// -- apply alpha. TODO
		// select from alpha channel, inverted, delete, delete alpha channel.
		
	}
	if (data.outputtype == "tiff")
	{
		saveOptions = CreateTiffSaveOptions(hasAlpha);
	}
	if (data.outputtype == "bmp")
	{
		saveOptions = CreateBmpSaveOptions(hasAlpha);
	}
	
	if (saveOptions == null)
    {
		$.writeln ("Not created save options");
		//newDoc.close(SaveOptions.DONOTSAVECHANGES);
		return;
	}
	newDoc.saveAs(new File(saveFile + "." + data.outputtype), saveOptions, false, Extension.LOWERCASE);
	
	// -- copy duplicate to symmetry path if one exist.
    var pathToExport = data.symmetrypath;
	if (data.copytosymmetrypath == true && Folder(pathToExport).exists == true)
	{
		symmetrypath = GetSymmetryPath(pathToExport);
		if (symmetrypath != null)
		{
			symmetrypath = symmetrypath + "/" + exportName + suffix + "." + data.outputtype;
			newDoc.saveAs(new File(symmetrypath), saveOptions, false, Extension.LOWERCASE);
		}
	}
    else if (data.copytosymmetrypath == true)
    {
		$.writeln ("Path to symmetry export not exist." + " Path = " + pathToExport);
    }
	
	// -- close
	newDoc.close(SaveOptions.DONOTSAVECHANGES);
	// -- make original document active
	app.activeDocument = docRef;
	
	/*undo code sample
	var baseState = doc.historyStates.length - 2;
	doc.activeHistoryState = doc.historyStates[baseState];
	doc.save();
	*/
}

function ConstructDocumentFromGroup(newDoc, data, textureType)
{
	// -- hide unuseful layers or layerSet.
	for (var i = 0; i < newDoc.layers.length; i++) 
	{
		var layerName = newDoc.layers[i].name;
		newDoc.layers[i].visible = false;
		if (textureType == layerName)
		{
			newDoc.layers[i].visible = true;
			newDoc.activeLayer = newDoc.layers[i];
		}
	}
	
	// -- create background layer.
	CreateLayer(newDoc, [0, 0, 0]);
	newDoc.activeLayer.isBackgroundLayer = true;
	
	// -- copy texture slot to alpha channel.
	for (var i = 0; i < data.alphaslots.length; i++)
	{
		var alphaToType = data.alphaslots[i].source;
		if (data.alphaslots[i].slot != textureType || alphaToType == "") continue;
		
		//$.writeln("Export alpha: ", data.alphaslots[i].slot, " ", data.alphaslots[i].source);
		
		var alphaSet = getByName(newDoc.layerSets, alphaToType, false);
		
		if (alphaSet != null)
		{
			SetChannelFromLayerGroup(newDoc, alphaSet, 3);
			break;
		}
	}	
}

function ConstructDocumentFromChannels(newDoc, textureType, slotTemplate)
{
	// -- delete unuseful layers or layerSet.
	var multichannelGroup = DeleteAllExcept(newDoc, textureType);
	
	// -- make background layer.
	CreateLayer(newDoc, [0, 0, 0]);
	newDoc.activeLayer.isBackgroundLayer = true;
	
	var layersArray = [];
	for (var i = 0; i < multichannelGroup.layers.length; i++) 
	{	
		var layer = multichannelGroup.layers[i];
		layer.allLocked = false;
		layer.visible = false;
		layersArray.push(layer);
	}
	
	for (var i = 0; i < layersArray.length; i++)
	{
		var layer = layersArray[i];
		
		if (layer.name == "(R)" && slotTemplate.fill_r != undefined && slotTemplate.fill_r != "null")
		{
			//$.writeln("Channel: R");
			SetChannelFromLayerGroup(newDoc, layer, 0);
			continue;
		}
		if (layer.name == "(G)" && slotTemplate.fill_g != undefined && slotTemplate.fill_g != "null")
		{
			//$.writeln("Channel: G");
			SetChannelFromLayerGroup(newDoc, layer, 1);
			continue;
		}
		if (layer.name == "(B)" && slotTemplate.fill_b != undefined && slotTemplate.fill_b != "null")
		{
			//$.writeln("Channel: B");
			SetChannelFromLayerGroup(newDoc, layer, 2);
			continue;
		}
		if (layer.name == "(A)" && slotTemplate.fill_a != undefined && slotTemplate.fill_a != "null")
		{
			//$.writeln("Channel: A");
			SetChannelFromLayerGroup(newDoc, layer, 3);
			continue;
		}
	}
}

// ---------------------------------------------------------------------------------------------------------------------
//
// ---------------------------------------------------------------------------------------------------------------------
function GetSlotTemplate(slotTemplates, slot)
{
	var templateSlot = null;
	for (s = 0; s < slotTemplates.length; s++)
	{
		templateSlot = slotTemplates[s];
		if (templateSlot.slot == slot)
		{
			return templateSlot;
		}
	}
	return null;
}

// ---------------------------------------------------------------------------------------------------------------------
// Delete all layers or groups except 'textureType'.
// ---------------------------------------------------------------------------------------------------------------------
function DeleteAllExcept(doc, textureType)
{	
	for (var i = 0; i < doc.layers.length; i++) 
	{	
		doc.layers[i].allLocked = false;
		doc.layers[i].visible = false;
		if (textureType != doc.layers[i].name) doc.layers[i].visible = true;
	}
	
	// -- set active layer wich not equal with textureType.
	if (doc.layers[0].name == textureType) doc.activeLayer = doc.layers[1];
	if (doc.layers[1].name == textureType) doc.activeLayer = doc.layers[0];
	
	doc.mergeVisibleLayers();
	doc.activeLayer.remove();
	
	//--
	doc.activeLayer.visible = true;
	
	return doc.activeLayer;
}

function DeleteAllExcept_OLD(doc, textureType)
{
	var arr = [];
	
	for (var i = 0; i < doc.layers.length; i++) 
	{	
		if (textureType != doc.layers[i].name)
		{
			arr.push(doc.layers[i]);
		}
	}
	
	for (var i = 0; i < arr.length; i++) 
	{
		// -- delete.
		arr[i].visible = true;
		arr[i].allLocked = false;
		//doc.activeLayer = arr[i];
		
		if (arr[i].typename == "LayerSet")
		{
			var merged = arr[i].merge();
			merged.remove();
		}
		else
		{
			arr[i].remove();
			
			if (doc.layers[i].typename == "ArtLayer")
			{
				//arr[i].remove();
			}
		}
	}
}

// ---------------------------------------------------------------------------------------------------------------------
// Check.
// ---------------------------------------------------------------------------------------------------------------------
function CheckForErrors(data_nonpow2)
{
	var isErrors = false;
	
	if (app.documents.length == 0)
	{
		alert ('You must have a document open to export!');
		isErrors = true;
	}
	
	// -- check if document not saved.
	var isSaved = false;
	try
	{
		//	docRef.fullName		docRef.path
		if (docRef.path.toString() != "") isSaved = true;
	}
	catch(e)
	{
		isSaved = false;
	}
	if (!isSaved)
	{
		alert("Document must be saved.","Alert");
		isErrors = true;
	}
	
	// -- check texture size.
	if (data_nonpow2 == false && CheckDocumentSize() == false)
	{
		alert("Non 2 pow texture size.","Alert");
		isErrors = true;
	}
	
	if (isErrors)
	{
		CloseWindow();
	}
	
	return isErrors;
}

// ---------------------------------------------------------------------------------------------------------------------
// Load projects from environment var. Called from Flex. 
// ---------------------------------------------------------------------------------------------------------------------
function LoadProjectsPath()
{
	// -- projects path. TODO: Работает только в windows.
	var env_projects = $.getenv("WORKING_PROJECTS_PATH");
	if (env_projects != null)
	{
		var projects = env_projects.split(";");
		//dlg.fp.invokePlayerFunction ("AddSymmetryPath", "<path to project>");
		for (var i = 0; i < projects.length; i++)
		{
			p = projects[i];
			p = string_lstrip(p);
			p = string_rstrip(p);
			if (p.length > 5) dlg.fp.invokePlayerFunction ("AddSymmetryPath", p);
		}
	}	
}

// ---------------------------------------------------------------------------------------------------------------------
// Close dialog.
// ---------------------------------------------------------------------------------------------------------------------
function CloseWindow()
{
	try
	{
		dlg.close ();
	}
	catch(e)
	{
		alert(e);
	}
}

// ---------------------------------------------------------------------------------------------------------------------
// Set dialog size. Called from Flex.
// ---------------------------------------------------------------------------------------------------------------------
function SetWindowSize(width, height)
{
	dlg.bounds.width = width;
	dlg.bounds.height = height;
	
	dlg.fp.bounds.width = width;
	dlg.fp.bounds.height = height;
}

// ---------------------------------------------------------------------------------------------------------------------
//	Copy to symmetry path.
// ---------------------------------------------------------------------------------------------------------------------
function GetSymmetryPath(symmetryBasePath)
{
	// -- check for last slash in symmetryBasePath.
	var lastChar = symmetryBasePath.charAt(symmetryBasePath.length - 1);
	if (lastChar != "\\" && lastChar != "/")
	{
		symmetryBasePath += "\\";
	}
	
	var fullPath = null;
	var thepath = docRef.path.fsName.toLowerCase();
	theindex = thepath.indexOf("models");
    if (theindex != -1)
    {
        // -- find relative path from models.
        relativePath = docRef.path.fsName.substring(theindex, thepath.length);
		fullPath = symmetryBasePath + relativePath;
    }
    else
    {
        // -- find relative path from textures.
		theindex = thepath.indexOf("textures");
        relativePath = docRef.path.fsName.substring(theindex, thepath.length);
		fullPath = symmetryBasePath + relativePath;
    }
	if (fullPath == null) return null;
	//$.writeln("Relative:" + relativePath);
	//$.writeln("Full:" + fullPath);
		
	// -- create path if not exist
	fullPathFolder = Folder ( fullPath );
	if (!fullPathFolder.exists)
	{
		fullPathFolder.create();
	}
	
	return fullPath;
}

// ---------------------------------------------------------------------------------------------------------------------
// Save options.
// ---------------------------------------------------------------------------------------------------------------------
function CreateTgaSaveOptions(hasAlpha)
{
    var saveOptions = new TargaSaveOptions();
	if (hasAlpha == true)
	{
		saveOptions.resolution = TargaBitsPerPixels.THIRTYTWO;
		saveOptions.alphaChannels = true;
	}
	else
	{
		saveOptions.resolution = TargaBitsPerPixels.TWENTYFOUR;
		saveOptions.alphaChannels = false;
	}
	saveOptions.rleCompression = false;
    
    return saveOptions;
}

function CreatePngSaveOptions(hasAlpha)
{
	var saveOptions = new PNGSaveOptions();
	saveOptions.interlaced = false;
	return saveOptions;
}

function CreateTiffSaveOptions(hasAlpha)
{
	saveOptions = new TiffSaveOptions();
	if (hasAlpha == true)
	{
		saveOptions.alphaChannels = true;
	}
	else
	{	
		saveOptions.alphaChannels = false;
	}
	//if (TIFFEncoding.JPEG == exportInfo.tiffCompression)
	//saveOptions.jpegQuality = exportInfo.tiffJpegQuality;
	//saveOptions.embedColorProfile = exportInfo.icc;
	//saveOptions.imageCompression = exportInfo.tiffCompression;
	saveOptions.layers = false;
	//saveOptions.transparency = 
	
	return saveOptions;
}

function CreateBmpSaveOptions(hasAlpha)
{
	var saveOptions = new BMPSaveOptions();
	if (hasAlpha == true)
	{
		saveOptions.alphaChannels = true;
		saveOptions.depth = BMPDepthType.THIRTYTWO;
	}
	else
	{
		saveOptions.alphaChannels = false;
		saveOptions.depth = BMPDepthType.TWENTYFOUR;
	}
	saveOptions.flipRowOrder = false;
	saveOptions.osType = OperatingSystem.WINDOWS; //OS2
	saveOptions.rleCompression = false;
	
	return saveOptions;
}

// ---------------------------------------------------------------------------------------------------------------------
// Create artLayer and fill.
// Param color is array like [255, 0, 0] or null (layer not fill).
// ---------------------------------------------------------------------------------------------------------------------
function CreateLayer(doc, color)
{
	doc.artLayers.add();
	doc.selection.selectAll();
	
	if (color != null)
	{
		// -- fill.
		var fillColor = new SolidColor();
		fillColor.rgb.red = color[0];
		fillColor.rgb.green = color[1];
		fillColor.rgb.blue = color[2];
		doc.selection.fill(fillColor);
	}
	
	doc.selection.deselect();	
}

// ---------------------------------------------------------------------------------------------------------------------
// Create group and layer and fill layer.
// Param color is array like [255, 0, 0] or null (layer not fill).
// If group != null new group will be created as parent of group, otherwise in root.
// ---------------------------------------------------------------------------------------------------------------------
function CreateGroupAndLayer(doc, group, newGroupName, color)
{
	var newGroup = null;
	
	if (group != null && newGroupName != null)
	{
		// -- create sub group.
		newGroup = group.layerSets.add();
	}
	else if (group == null && newGroupName != null)
	{
		// -- create group.
		newGroup = doc.layerSets.add();
	}
	else return;
	
	newGroup.name = newGroupName;
	newGroup.artLayers.add();
	doc.selection.selectAll();
	
	if (color != null)
	{
		// -- fill.
		var fillColor = new SolidColor();
		fillColor.rgb.red = color[0];
		fillColor.rgb.green = color[1];
		fillColor.rgb.blue = color[2];
		doc.selection.fill(fillColor);
	}
	
	doc.selection.deselect();	
}

// ---------------------------------------------------------------------------------------------------------------------
// Create channel from layerGroup and delete layerGroup after that.
// channel - must be 0, 1, 2 or 3.
// Document must contain backgroundLayer.
// ---------------------------------------------------------------------------------------------------------------------
function SetChannelFromLayerGroup(doc, layerGroup, channel)
{
	if (channel != 0 && channel != 1 && channel != 2 && channel != 3) return;
	
	// -- find background layer.
	var background = doc.backgroundLayer;

	layerGroup.visible = true;
	
	var layer = layerGroup.merge();
	doc.activeLayer = layer;
	doc.selection.selectAll();
	doc.selection.copy();
	layer.visible = false;
	doc.activeLayer = background;
	
	if (channel == 3 && doc.channels.length == 3)
	{
		// -- add alpha channel if needed.
		doc.channels.add();
	}
	
	doc.activeChannels = [doc.channels[channel]];
	
	doc.paste();
	doc.selection.deselect();

	// -- restore channel selection.
	doc.channels[0].visible = true;
	doc.channels[1].visible = true;
	doc.channels[2].visible = true;
	if (doc.channels.length > 3) doc.channels[3].visible = false;
	doc.activeChannels = [doc.channels[0], doc.channels[1], doc.channels[2]];
	
	// -- delete.
	layer.remove();
}

// ---------------------------------------------------------------------------------------------------------------------
//	Generate template structure.
// ---------------------------------------------------------------------------------------------------------------------
function CreateGroupFolders(data, slotTemplates)
{
	var doc = app.activeDocument;
	
	for (i = 0; i < data.textureslots.length; i++)
	{	
		var slot = data.textureslots[i].slot;
		
		// -- get template slot.
		var slotTemplate = GetSlotTemplate(slotTemplates, slot);
		if (slotTemplate == null) continue;
		
		if (slotTemplate.fill == undefined)
		{
			// -- create multichannel group structure.
			var group = doc.layerSets.add();
			group.name = slot;
			
			if (slotTemplate.fill_r != undefined && slotTemplate.fill_r != "null")
			{
				var rgb = slotTemplate.fill_r.split(";");
				CreateGroupAndLayer(doc, group, "(R)", rgb);
			}
			if (slotTemplate.fill_g != undefined && slotTemplate.fill_g != "null")
			{
				var rgb = slotTemplate.fill_g.split(";");
				CreateGroupAndLayer(doc, group, "(G)", rgb);
			}
			if (slotTemplate.fill_b != undefined && slotTemplate.fill_b != "null")
			{
				var rgb = slotTemplate.fill_b.split(";");
				CreateGroupAndLayer(doc, group, "(B)", rgb);
			}
			if (slotTemplate.fill_a != undefined && slotTemplate.fill_a != "null")
			{
				var rgb = slotTemplate.fill_a.split(";");
				CreateGroupAndLayer(doc, group, "(A)", rgb);
			}
		}
		else
		{	
			var rgb = slotTemplate.fill.split(";");
			CreateGroupAndLayer(doc, null, slot, rgb);
		}
	}
				
	// -- delete default layer.
	doc.artLayers.removeAll();
	// -- close window
	CloseWindow();
}

// ---------------------------------------------------------------------------------------------------------------------
//	Check document size for powers of 2.
// ---------------------------------------------------------------------------------------------------------------------
function CheckDocumentSize ()
{
	// -- check document size
	var powers = new Array(2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192);
	var heightMatch = 0;
	var widthMatch = 0;
	for ( x = 0 ; x < powers.length ; x++ )
	{
		if ( docWidth == powers[x]  )
		{
			heightMatch = 1;
		}
		if ( docHeight == powers[x]  )
		{
			widthMatch = 1;
		}
	}
	// -- see if it matches the powers if not get out of here
	if ( heightMatch == 0 || widthMatch == 0 )
	{
		return false;
	}
	return true;
}

// ---------------------------------------------------------------------------------------------------------------------
//	Downscale texture size.
// ---------------------------------------------------------------------------------------------------------------------
function DownscaleSize(coeff)
{	
	if (coeff == 1) return;
	
	var newWidth = app.activeDocument.width/coeff;
	var newHeight = app.activeDocument.height/coeff;
	// TODO: проверять чтобы даунскейленные значения не выходили за рамки (не равны 0, степень двойки если надо и т.д)
	app.activeDocument.resizeImage(newWidth, newHeight, app.activeDocument.resolution, ResampleMethod.BICUBIC);
}

// ---------------------------------------------------------------------------------------------------------------------
//	Remove alpha channel from active document.
// ---------------------------------------------------------------------------------------------------------------------
function RemoveAlphaChannels() 
{
	var channels = app.activeDocument.channels;
	var channelCount = channels.length - 1;
	while ( channels[channelCount].kind != ChannelType.COMPONENT ) 
	{
		channels[channelCount].remove();
		channelCount--;
	}
}

// ---------------------------------------------------------------------------------------------------------------------
// Return an item called 'name' from the specified container.
// This works for the "magic" on PS containers like Documents.getByName(),
// for instance. However this returns null if an index is not found instead
// of throwing an exception
// The 'all' arg is optional and defaults to 'false'
// ---------------------------------------------------------------------------------------------------------------------
function getByName(container, name, all) 
{
	// -- check for a bad index
	if (!name) throw "'undefined' is an invalid name/index";

	var matchFtn;

	if (name instanceof RegExp) 
	{
		matchFtn = function(s1, re) { return s1.match(re) != null; }
	} 
	else 
	{
		matchFtn = function(s1, s2) { return s1 == s2;  }
	}

	var obj = [];

	for (var i = 0; i < container.length; i++) 
	{
		if (matchFtn(container[i].name, name)) 
		{
			if (!all) 
			{
				return container[i];     // -- there can be only one
			}
			obj.push(container[i]);    // -- add it to the list
		}
	}

	return all ? obj : undefined;
}

function getAllByName(container, name) 
{
	return getByName(container, name, true);
}

// ---------------------------------------------------------------------------------------------------------------------
// String functions.
// ---------------------------------------------------------------------------------------------------------------------
function string_split ( word, splitat )
{
	splitword = word.split ( splitat );
	return ( splitword );
}

function string_replace ( word, before, after )
{
	replaced = word.replace ( before, after );
	return ( replaced );
}

function string_rstrip(str)
{
    new_str = ""
    for (var i = str.length - 1; i >= 0; i--)
    {
        if (str[i] != ' ')
        {
            new_str = str.substr(0, i + 1);
            break;
        }
    }
    return (new_str);
}

function string_lstrip(str)
{
    new_str = ""
    for (var i = 0; i < str.length; i++)
    {
        if (str[i] != ' ')
        {
            new_str = str.substr(i);
            break;
        }
    }
    return (new_str);
}

// ---------------------------------------------------------------------------------------------------------------------
// Work with XML. Called from Flex.
// ---------------------------------------------------------------------------------------------------------------------
function LoadXML(filename)
{
	//$.writeln("load xml");
	
	textfile = new File( exporterFilepath + "/" + filename );
	if (textfile.exists == true)
    {
		textfile.open();
		// -- read through the text file
		var xml = "";
		while ( !textfile.eof )
		{
			line = textfile.readln();
			xml += line;
		}
		textfile.close;
	}
	
	return xml;
}

function SaveXML(filename, xml)
{
	textfile = new File( exporterFilepath + "/" + filename );
	textfile.open( "w" );
	textfile.write( xml );
	textfile.close;
}
