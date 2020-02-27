// =======================================================
// Sharpen Inkjet Output (step 1)
// TLR Inkjet Output Sharpening for CS2.js
// TLR Professional Sharpening Toolkit, Version 2.0
// (c) 2007, The Light's Right Studio, All Rights Reserved.
// http://www.thelightsrightstudio.com
// You may use this code freely for your own personal or professional use. You may not copy, upload, transmit,
// or share this code in any way without the express permission of the author.
function SharpenInkjetOutput()
{
	// -- 180 dpi = 1, 240 dpi = 2, 300 dpi = 3, 360 dpi = 4, 480 dpi = 5;
	const outputResolution = 2;
	// -- Matte = 1, Glossy = 2;
	const paperType = 1;
	// -- defaults for Preferences Checkboxes
	const expertMode = false;
	
	if (checkAssumptions() != true) return;
	var uiParamArray = [outputResolution, paperType, expertMode];
	// -- perform remaining required tasks
	performOutputSharpening(uiParamArray, 'L');
	performOutputSharpening(uiParamArray, 'D');
	addLayerSet(uiParamArray);
}

// =======================================================
//
function checkAssumptions(uiParamArray)
{
	var moduleName = 'checkAssumptions';

	try 
	{	
		// -- check that there is a loaded document
		if (app.documents.length == 0) {
			alert ('There is no active document selected.');
			return false;
		}
	
		// -- check that there is a background layer
		var hasBackgroundLayer = false;
		for (var i = 0; i < app.activeDocument.artLayers.length; i++) {
			if (app.activeDocument.artLayers[i].isBackgroundLayer == true) hasBackgroundLayer = true;
		} 
		if (hasBackgroundLayer == false) {
			alert ('The active document does not have a true Background layer.');
			return false;		
		}
		
		// -- check if Bitmap, Duotone, Multichannel
		if ((app.activeDocument.mode == DocumentMode.BITMAP) || (app.activeDocument.mode == DocumentMode.DUOTONE) ||
			(app.activeDocument.mode == DocumentMode.MULTICHANNEL) || (app.activeDocument.mode == DocumentMode.INDEXEDCOLOR)) {
			alert ('The active document must be in RGB, CMYK, L*a*b, or Grayscale mode.');
			return false;					
		}
		
		// -- check if layer is inside a layer set/group
		var layerParentName = app.activeDocument.activeLayer.parent.name;
		var documentName = app.activeDocument.name;
		if (layerParentName != documentName) {
			alert('The active layer cannot be inside a layer set. Please close the layer set before proceeding.');
			return false;
		}
		
		// -- check if layer is an open layer set/group by creating a new layer and checking the parent
		var id259 = charIDToTypeID( "Mk  " );
			var desc66 = new ActionDescriptor();
			var id260 = charIDToTypeID( "null" );
				var ref44 = new ActionReference();
				var id261 = charIDToTypeID( "Lyr " );
				ref44.putClass( id261 );
			desc66.putReference( id260, ref44 );
		executeAction( id259, desc66, DialogModes.NO );

		layerParentName = app.activeDocument.activeLayer.parent.name;
		app.activeDocument.activeLayer.remove();
		if (layerParentName != documentName) {
			alert('The active layer cannot be an open layer set. Please close the layer set before proceeding.');
			return false;
		}		
		
		return true;
	}
	catch(someError)
	{
		alert( "An unexpected JavaScript error occurred in " +  moduleName + ". Message = " + someError.description);
		ui.close(0);
	}
}

// =======================================================
//
function performOutputSharpening(uiParamArray, layerType)
{
	// -- defaults for Blend If Sliders
	const lightBlendIf = [0, 0, 235, 250, 90, 90, 250, 250];
	const darkBlendIf = [8, 16, 235, 250, 0, 0, 90, 90];
	// -- defaults for Highpass Filter Settings
	// -- Matte = 1, Glossy = 2;
	const settingsHighpassFilter = [2.2, 2.1, 2.0, 1.8, 1.7];
	// -- defaults for USM Filter Settings
	// -- Matte = M, Glossy = G;
	const settingsUSM180M = [290, 1.0 ,5];
	const settingsUSM180G = [275, 1.0 ,5];
	const settingsUSM240M = [315, 0.7 ,5];
	const settingsUSM240G = [300, 0.7 ,5];
	const settingsUSM300M = [340, 0.6 ,5];
	const settingsUSM300G = [325, 0.6 ,5];
	const settingsUSM360M = [365, 0.5 ,5];
	const settingsUSM360G = [350, 0.5 ,5];
	const settingsUSM480M = [390, 0.4 ,5];
	const settingsUSM480G = [375, 0.4 ,5];

	var docRef = app.activeDocument;
	var moduleName = 'performSharpening';

	try {
			
		var outputResolution = uiParamArray[0];
		var paperType = uiParamArray[1];
		var expertMode = uiParamArray[2];
		
		docRef.activeChannels = docRef.componentChannels;
		
		// -- release RAM
		app.purge(PurgeTarget.ALLCACHES);

		mergeAllVisible();

		// -- release RAM
		app.purge(PurgeTarget.ALLCACHES);

		switch (layerType)
		{
			case 'L': setLayerProperties('Output High Pass Light', 'BLUE'); break;
			case 'D': setLayerProperties('Output High Pass Dark', 'BLUE'); break;
		}

		// -- turn On Dialogs, If Expert Mode
		if ((expertMode == true)  && (layerType == 'L')) alert(strAdjustUSMSettingsLight);
		if ((expertMode == true)  && (layerType == 'D')) alert(strAdjustUSMSettingsDark);
		if (expertMode == true) app.displayDialogs = DialogModes.ALL;

		// -- change opacity to 65%
		docRef.activeLayer.opacity = 65;
	
		// -- set Blend If settings
		switch (layerType) 
		{
			case 'L': applyBlendIf(lightBlendIf); break;
			case 'D': applyBlendIf(darkBlendIf); break;
		}

		// -- change blend mode to luminosity
		if ((app.activeDocument.mode == DocumentMode.RGB) || (app.activeDocument.mode == DocumentMode.CMYK) ||
			(app.activeDocument.mode == DocumentMode.LAB)) {
			docRef.activeLayer.blendMode = BlendMode.LUMINOSITY;
		}
		
		if (paperType == 1) 
		{
			switch (outputResolution) {
				case 0: usmSettingsArray = settingsUSM180M; break;
				case 1: usmSettingsArray = settingsUSM240M; break;
				case 2: usmSettingsArray = settingsUSM300M; break;
				case 3: usmSettingsArray = settingsUSM360M; break;
				case 4: usmSettingsArray = settingsUSM480M; break; 
			 	default: alert('Unexpected data value. No sharpening will be applied.'); break;
			}
		}
		else 
		{
			switch (outputResolution) 
			{
				case 0: usmSettingsArray = settingsUSM180G; break;
				case 1: usmSettingsArray = settingsUSM240G; break;
				case 2: usmSettingsArray = settingsUSM300G; break;
				case 3: usmSettingsArray = settingsUSM360G; break;
				case 4: usmSettingsArray = settingsUSM480G; break; 
			 	default: alert('Unexpected data value. No sharpening will be applied.'); break;
			}
		}

		var usmAmount = usmSettingsArray[0];
		var usmRadius = usmSettingsArray[1];
		var usmThreshold = usmSettingsArray[2];
		docRef.activeLayer.applyUnSharpMask(usmAmount, usmRadius, usmThreshold);
		
		// -- fade to Luminosity Blend
		if ((app.activeDocument.mode == DocumentMode.RGB) || (app.activeDocument.mode == DocumentMode.CMYK) ||
			(app.activeDocument.mode == DocumentMode.LAB)) {
			fadeToLuminosity();
		}

		// -- release RAM
		app.purge(PurgeTarget.ALLCACHES);

		// -- display Dialogs, If Expert Mode
		if ((expertMode == true)  && (layerType == 'L')) alert(strAdjustHighPassSettingsLight);
		if ((expertMode == true)  && (layerType == 'D')) alert(strAdjustHighPassSettingsDark);
		
		// -- apply Highpass settings
		docRef.activeLayer.blendMode = BlendMode.OVERLAY;
		docRef.activeLayer.applyHighPass(settingsHighpassFilter[outputResolution]);

		// -- turn Off Dialogs
		app.displayDialogs = DialogModes.NO;

		// -- release RAM
		app.purge(PurgeTarget.ALLCACHES);

		// -- cleanup before returning
		docRef.activeChannels = docRef.componentChannels;
	}
	catch(someError)
	{
		alert( "An unexpected JavaScript error occurred in " +  moduleName + ". Message = " + someError.description);
	}
}

// =======================================================
//
function applyBlendIf(blendIfSettings)
{
	var moduleName = 'applyBlendIf';

	ThisBlackLow = blendIfSettings[0];
	ThisBlackHigh = blendIfSettings[1];
	ThisWhiteLow = blendIfSettings[2];
	ThisWhiteHigh = blendIfSettings[3];
	UnderlyingBlackLow = blendIfSettings[4];
	UnderlyingBlackHigh = blendIfSettings[5];
	UnderlyingWhiteLow = blendIfSettings[6];
	UnderlyingWhiteHigh = blendIfSettings[7];

	try 
	{
		// -- code generated by ScriptListener
		var id1457 = charIDToTypeID( "setd" );
		var desc339 = new ActionDescriptor();
		var id1458 = charIDToTypeID( "null" );
		var ref262 = new ActionReference();
		var id1459 = charIDToTypeID( "Lyr " );
		var id1460 = charIDToTypeID( "Ordn" );
		var id1461 = charIDToTypeID( "Trgt" );
		ref262.putEnumerated( id1459, id1460, id1461 );
		desc339.putReference( id1458, ref262 );
		var id1462 = charIDToTypeID( "T   " );
		var desc340 = new ActionDescriptor();
		var id1463 = charIDToTypeID( "Blnd" );
		var list117 = new ActionList();
		var desc341 = new ActionDescriptor();
		var id1464 = charIDToTypeID( "Chnl" );
		var ref263 = new ActionReference();
		var id1465 = charIDToTypeID( "Chnl" );
		var id1466 = charIDToTypeID( "Chnl" );
		var id1467 = charIDToTypeID( "Gry " );
		ref263.putEnumerated( id1465, id1466, id1467 );
		desc341.putReference( id1464, ref263 );
		var id1468 = charIDToTypeID( "SrcB" );
		desc341.putInteger( id1468, ThisBlackLow );
		var id1469 = charIDToTypeID( "Srcl" );
		desc341.putInteger( id1469, ThisBlackHigh );
		var id1470 = charIDToTypeID( "SrcW" );
		desc341.putInteger( id1470, ThisWhiteLow );
		var id1471 = charIDToTypeID( "Srcm" );
		desc341.putInteger( id1471, ThisWhiteHigh );
		var id1472 = charIDToTypeID( "DstB" );
		desc341.putInteger( id1472, UnderlyingBlackLow );
		var id1473 = charIDToTypeID( "Dstl" );
		desc341.putInteger( id1473, UnderlyingBlackHigh );
		var id1474 = charIDToTypeID( "DstW" );
		desc341.putInteger( id1474, UnderlyingWhiteLow );
		var id1475 = charIDToTypeID( "Dstt" );
		desc341.putInteger( id1475, UnderlyingWhiteHigh );
		var id1476 = charIDToTypeID( "Blnd" );
		list117.putObject( id1476, desc341 );
		desc340.putList( id1463, list117 );
		var id1477 = charIDToTypeID( "Lefx" );
		var desc342 = new ActionDescriptor();
		var id1478 = charIDToTypeID( "Scl " );
		var id1479 = charIDToTypeID( "#Prc" );
		desc342.putUnitDouble( id1478, id1479, 333.333333 );
		var id1480 = charIDToTypeID( "Lefx" );
		desc340.putObject( id1477, id1480, desc342 );
		var id1481 = charIDToTypeID( "Lyr " );
		desc339.putObject( id1462, id1481, desc340 );
		executeAction( id1457, desc339, DialogModes.NO );
	}
	catch(someError)
	{
		alert( "An unexpected JavaScript error occurred in " +  moduleName + ". Message = " + someError.description);
	}
}

// =======================================================
//
function convertLayerToChannel()
{
	var moduleName = 'applyConvertLayerToChannel';

	try 
	{
		var id218 = charIDToTypeID( "Mk  " );
		var desc57 = new ActionDescriptor();
		var id219 = charIDToTypeID( "Nw  " );
		var id220 = charIDToTypeID( "Chnl" );
		desc57.putClass( id219, id220 );
		var id221 = charIDToTypeID( "Usng" );
		var desc58 = new ActionDescriptor();
		var id222 = charIDToTypeID( "T   " );
		var ref25 = new ActionReference();
		var id223 = charIDToTypeID( "Chnl" );
		var id224 = charIDToTypeID( "Chnl" );
		var id225 = charIDToTypeID( "Gry " );
		ref25.putEnumerated( id223, id224, id225 );
		var id226 = charIDToTypeID( "Lyr " );
		var id227 = charIDToTypeID( "Ordn" );
		var id228 = charIDToTypeID( "Mrgd" );
		ref25.putEnumerated( id226, id227, id228 );
		desc58.putReference( id222, ref25 );
		var id229 = charIDToTypeID( "Src2" );
		var ref26 = new ActionReference();
		var id230 = charIDToTypeID( "Chnl" );
		var id231 = charIDToTypeID( "Chnl" );
		var id232 = charIDToTypeID( "Gry " );
		ref26.putEnumerated( id230, id231, id232 );
		desc58.putReference( id229, ref26 );
		var id233 = charIDToTypeID( "Clcl" );
		desc57.putObject( id221, id233, desc58 );
		executeAction( id218, desc57, DialogModes.NO );
	}
	catch(someError)
	{
		alert( "An unexpected JavaScript error occurred in " +  moduleName + ". Message = " + someError.description);
	}
}

// =======================================================
//
function fadeToLuminosity()
{
	var id14 = charIDToTypeID( "Fade" );
	var desc5 = new ActionDescriptor();
	var id15 = charIDToTypeID( "Opct" );
	var id16 = charIDToTypeID( "#Prc" );
	desc5.putUnitDouble( id15, id16, 65.000000 );
	var id17 = charIDToTypeID( "Md  " );
	var id18 = charIDToTypeID( "BlnM" );
	var id19 = charIDToTypeID( "Lmns" );
	desc5.putEnumerated( id17, id18, id19 );
	executeAction( id14, desc5, DialogModes.NO );
}

// =======================================================
//
function getPSVersion()
{
	var psVersion = new String(app.version);
	return psVersion.charAt(0);
}

// =======================================================
//
function mergeAllVisible()
{
	var moduleName = 'applyMergeAllVisible';

	try 
	{
		var id836 = charIDToTypeID( "Mk  " );
		var desc233 = new ActionDescriptor();
		var id837 = charIDToTypeID( "null" );
		var ref196 = new ActionReference();
		var id838 = charIDToTypeID( "Lyr " );
		ref196.putClass( id838 );
		desc233.putReference( id837, ref196 );
		executeAction( id836, desc233, DialogModes.NO );
		
		var id839 = charIDToTypeID( "MrgV" );
		var desc234 = new ActionDescriptor();
		var id840 = charIDToTypeID( "Dplc" );
		desc234.putBoolean( id840, true );
		executeAction( id839, desc234, DialogModes.NO );
	}
	catch(someError)
	{
		alert( "An unexpected JavaScript error occurred in " +  moduleName + ". Message = " + someError.description);
	}
}

// =======================================================
//
function setLayerProperties(layerName, layerColor)
{
	colorCode = new String(layerColor);
	colorCode = colorCode.toUpperCase();
	var moduleName = 'setLayerProperties';


	try 
	{
		// -- code generated by ScriptListener
		var id50 = charIDToTypeID( "setd" );
		var desc17 = new ActionDescriptor();
		var id51 = charIDToTypeID( "null" );
		var ref1 = new ActionReference();
		var id52 = charIDToTypeID( "Lyr " );
		var id53 = charIDToTypeID( "Ordn" );
		var id54 = charIDToTypeID( "Trgt" );
		ref1.putEnumerated( id52, id53, id54 );
		desc17.putReference( id51, ref1 );
		var id55 = charIDToTypeID( "T   " );
		var desc18 = new ActionDescriptor();
		var id56 = charIDToTypeID( "Nm  " );
		desc18.putString( id56, layerName );
		var id57 = charIDToTypeID( "Clr " );
		var id58 = charIDToTypeID( "Clr " );
		switch (colorCode) 
		{
			case 'RED': id59 = charIDToTypeID( "Rd  " ); break;
			case 'ORANGE': id59 = charIDToTypeID( "Orng" ); break;
			case 'YELLOW': id59 = charIDToTypeID( "Ylw " ); break;
			case 'GREEN': id59 = charIDToTypeID( "Grn " ); break;
			case 'BLUE': id59 = charIDToTypeID( "Bl  " ); break;
			case 'VIOLET': id59 = charIDToTypeID( "Vlt " ); break;
			case 'GRAY': id59 = charIDToTypeID( "Gry " ); break;
			 default: id59 = charIDToTypeID( "Clr " );
		}
		desc18.putEnumerated( id57, id58, id59 );
		var id60 = charIDToTypeID( "Lyr " );
		desc17.putObject( id55, id60, desc18 );
		executeAction( id50, desc17, DialogModes.NO );
	}
	catch(someError)
	{
		alert( "An unexpected JavaScript error occurred in " +  moduleName + ". Message = " + someError.description);
	}
}

// =======================================================
//
function addLayerSet(uiParamArray)
{
	var docRef = app.activeDocument;
	var moduleName = 'addLayerSet';

	try 
	{	
		// -- use layer sets, if Photoshop CS
		var psVersion = new String(app.version);
		if ((psVersion.charAt(0) == '8') || (psVersion.charAt(0) == '9')|| ((psVersion.charAt(0) == '1') && (psVersion.charAt(1) == '0'))) {
			// -- make new layer set and set properties, if PS CS version
			var id346 = charIDToTypeID( "Mk  " );
			var desc79 = new ActionDescriptor();
			var id347 = charIDToTypeID( "null" );
			var ref58 = new ActionReference();
			var id348 = stringIDToTypeID( "layerSection" );
			ref58.putClass( id348 );
			desc79.putReference( id347, ref58 );
			var id349 = charIDToTypeID( "Usng" );
			var desc80 = new ActionDescriptor();
			var id350 = charIDToTypeID( "Nm  " );
			desc80.putString( id350, "TLR Output Sharpening" );
			var id351 = charIDToTypeID( "Clr " );
			var id352 = charIDToTypeID( "Clr " );
			var id353 = charIDToTypeID( "Bl  " );
			desc80.putEnumerated( id351, id352, id353 );
			var id354 = stringIDToTypeID( "layerSection" );
			desc79.putObject( id349, id354, desc80 );
			executeAction( id346, desc79, DialogModes.NO );
			
			// -- set reference to active layer set
			var layerSetRef = docRef.activeLayer;
			
			// -- move layers into layer set
			layerRef = docRef.layers['Output High Pass Light'];
			layerRef.moveToEnd(layerSetRef);
			layerRef.visible = true;
			layerRef = docRef.layers['Output High Pass Dark'];
			layerRef.moveToEnd(layerSetRef);
			layerRef.visible = true;
		}
	}
	catch(someError)
	{
		alert( "An unexpected JavaScript error occurred in " +  moduleName + ". Message = " + someError.description);
	}
}

// =======================================================
// TLR Local Contrast Enhancement for CS2.js
// TLR Professional Sharpening Toolkit, Version 2.0
// (c) 2007, The Light's Right Studio, All Rights Reserved.
// http://www.thelightsrightstudio.com
// You may use this code freely for your own personal or professional use. You may not copy, upload, transmit,
// or share this code in any way without the express permission of the author.
function SharpenLocalContrast()
{
	if (checkAssumptions() != true) return;
	// -- defaults for Preferences Checkboxes
	const expertMode = false;
	// -- defaults for sliders
	// -- Minimum = 1, Maximum = 5
	const usmAmountSlider = 3;

	var amountScroll = Math.round(usmAmountSlider);
	var uiParamArray = [amountScroll, expertMode];
				
	// -- perform remaining required tasks
	performSharpening(uiParamArray);
}

// =======================================================
//
function performSharpening(uiParamArray)
{
	// -- default for layer mask
	const useRevealAllLayerMask = true;
	// -- defaults for sliders
	// -- Minimum = 1, Maximum = 5
	const usmAmountSliderDefault = 3;
	// -- defaults for Blend If Sliders
	const singleBlendIf = [16, 24, 208, 224, 28, 52, 176, 208];
	// -- defaults for USM Settings
	// -- USM settings are [Amount, Radius, Threshold]
	const settingsUSM1 = [20, 30, 0];
	const settingsUSM2 = [20, 40, 0];
	const settingsUSM3 = [20, 50, 0];
	const settingsUSM4 = [30, 50, 0];
	const settingsUSM5 = [30, 60, 0];
	var docRef = app.activeDocument;
	var moduleName = 'performSharpening';

	try 
	{		
		var amountScroll = uiParamArray[0];
		var expertMode = uiParamArray[1];
		
		docRef.activeChannels = docRef.componentChannels;
		
		// -- release RAM
		app.purge(PurgeTarget.ALLCACHES);

		mergeAllVisible();

		// -- release RAM
		app.purge(PurgeTarget.ALLCACHES);

		setLayerProperties('TLR Local Contrast Enhancement', 'Green');
		if (expertMode == true) alert(strAdjustUSMSettings);
		
		// -- add Reveal All layer mask
		var id189 = charIDToTypeID( "Mk  " );
		var desc56 = new ActionDescriptor();
		var id190 = charIDToTypeID( "Nw  " );
		var id191 = charIDToTypeID( "Chnl" );
		desc56.putClass( id190, id191 );
		var id192 = charIDToTypeID( "At  " );
		var ref50 = new ActionReference();
		var id193 = charIDToTypeID( "Chnl" );
		var id194 = charIDToTypeID( "Chnl" );
		var id195 = charIDToTypeID( "Msk " );
		ref50.putEnumerated( id193, id194, id195 );
		desc56.putReference( id192, ref50 );
		var id196 = charIDToTypeID( "Usng" );
		var id197 = charIDToTypeID( "UsrM" );
		if (useRevealAllLayerMask == true) var id198 = charIDToTypeID( "RvlA" );
		else id198 = charIDToTypeID( "HdAl" );
		desc56.putEnumerated( id196, id197, id198 );
		executeAction( id189, desc56, DialogModes.NO );
		
		docRef.activeChannels = docRef.componentChannels;
	
		// -- calculate sharpening settings
		sharpenSetting = amountScroll;
		
		// -- turn On Dialogs, If Expert Mode
		if (expertMode == true) app.displayDialogs = DialogModes.ALL;
		
		// -- apply USM settings
		switch (sharpenSetting) 
		{
			case 1: usmSettingsArray = settingsUSM1; break;
			case 2: usmSettingsArray = settingsUSM2; break;
			case 3: usmSettingsArray = settingsUSM3; break;
			case 4: usmSettingsArray = settingsUSM4; break;
			case 5: usmSettingsArray = settingsUSM5; break;
			default: alert(strUnexpectedSharpeningValue);
			break;
		}
		var usmAmount = usmSettingsArray[0];
		var usmRadius = usmSettingsArray[1];
		var usmThreshold = usmSettingsArray[2];
		docRef.activeLayer.applyUnSharpMask(usmAmount, usmRadius, usmThreshold);
	
		// -- turn Off Dialogs
		app.displayDialogs = DialogModes.NO;
		
		// -- change blend mode to luminosity
		if ((app.activeDocument.mode == DocumentMode.RGB) || 
			(app.activeDocument.mode == DocumentMode.CMYK) ||
			(app.activeDocument.mode == DocumentMode.LAB)) 
		{
			docRef.activeLayer.blendMode = BlendMode.LUMINOSITY;
		}
				
		// -- change opacity to 65%
		docRef.activeLayer.opacity = 65;
	
		// -- set Blend If settings	
		applyBlendIf(singleBlendIf);
	
		// -- release RAM
		app.purge(PurgeTarget.ALLCACHES);

		// -- cleanup before returning
		docRef.activeChannels = docRef.componentChannels;
	}
	catch(someError)
	{
		alert( "An unexpected JavaScript error occurred in " +  moduleName + ". Message = " + someError.description);
	}
}
