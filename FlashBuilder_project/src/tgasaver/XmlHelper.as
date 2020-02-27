package tgasaver
{
	import flash.external.ExternalInterface;
	
	import mx.controls.Alert;
	
	public class XmlHelper
	{
		public static var configFile:String = "TgaSaver_conf.xml";
		public static var slotsFile:String = "TgaSaver_slots.xml";
		
		public function XmlHelper()
		{
		}
		
		// Get export data from xml and save one into object.
		public static function GetExportData(configXML:XML):Object//, slotTemplates:Array):Object
		{
			var data:Object = new Object();
			var arr:Array = new Array();
			
			// Export types.
			var types:XMLList = configXML.types.*;
			for(var i:int = 0; i < types.length(); i++)
			{
				arr.push({slot:new String(types[i].@slot), selected:(types[i].@selected == "true")?true:false});
			}
			data.textureslots = arr;
			
			// Downscale.
			arr = new Array();
			var downscales:XMLList = configXML.downscale.*;
			for(i = 0; i < downscales.length(); i++)
			{
				arr.push({slot:new String(downscales[i].@slot), coeff:int(downscales[i].@coeff)});
			}
			data.downscaleslots = arr;
			
			// Alpha.
			arr = new Array();
			var alphas:XMLList = configXML.alpha.*;
			for(i = 0; i < alphas.length(); i++)
			{
				arr.push({slot:new String(alphas[i].@slot), source:new String(alphas[i].@source)});
			}
			data.alphaslots = arr;
			
			// Options.
			data.outputtype = new String(configXML.options.outputtype.@value);
			data.nonpow2 = (configXML.options.nonpow2.@selected == "true")?true:false;
			data.sharpencontrast = (configXML.options.sharpencontrast.@selected == "true")?true:false;
			data.onlyexport = (configXML.options.onlyexport.@selected == "true")?true:false;
			data.copytosymmetrypath = (configXML.options.copytosymmetrypath.@selected == "true")?true:false;
			data.symmetrypath = new String(configXML.lastprojectpath.@path);
			
			//Alert.show(configXML.toString(), "", mx.controls.Alert.OK);
			
			return data;
		}
		
		public static function GetSlotTemplates():Array
		{
			var slotTemplates:Array = new Array();
			
			var str:String = ExternalInterface.call("LoadXML", XmlHelper.slotsFile);
			var slotsXML:XML = new XML(str);
			var values:XMLList = slotsXML.*;
			for(var i:int = 0; i < values.length(); i++)
			{
				var slot:String = new String(values[i].@slot);
				var suffix:String = new String(values[i].@suffix);
				var allowSharpen:String = new String(values[i].@allowSharpen);
				if (values[i].hasOwnProperty("@fill"))
				{
					slotTemplates.push({slot:slot, suffix:suffix, fill:new String(values[i].@fill), allowSharpen:allowSharpen});
				}
				else
				{
					var fillR:String = (values[i].hasOwnProperty("@fill_r"))? new String(values[i].@fill_r) : "null";
					var fillG:String = (values[i].hasOwnProperty("@fill_g"))? new String(values[i].@fill_g) : "null";
					var fillB:String = (values[i].hasOwnProperty("@fill_b"))? new String(values[i].@fill_b) : "null";
					var fillA:String = (values[i].hasOwnProperty("@fill_a"))? new String(values[i].@fill_a) : "null";
					slotTemplates.push({slot:slot, suffix:suffix, fill_r:fillR, fill_g:fillG, fill_b:fillB, fill_a:fillA, allowSharpen:allowSharpen});
				}
			}
			
			return slotTemplates;
		}
		
		public static function LoadConfig():void
		{
			
		}
		
		public static function SaveConfig():void
		{
			
		}
		
		// Save default xml.
		public static function SaveDefaultSlotTemplates():void
		{
			var newXML:XML = <data/>;
			newXML.appendChild(<value slot="diffuse" suffix="_df" fill="128;128;128" allowSharpen="true"> </value>);
			newXML.appendChild(<value slot="normal" suffix="_nm" fill="128;128;255" allowSharpen="false"> </value>);
			newXML.appendChild(<value slot="specular" suffix="_sp" fill="0;0;0" allowSharpen="true"> </value>); 
			newXML.appendChild(<value slot="specular color" suffix="_spc" fill="0;0;0" allowSharpen="true"> </value>);
			newXML.appendChild(<value slot="specular level" suffix="_spl" fill="0;0;0" allowSharpen="true"> </value>); 
			newXML.appendChild(<value slot="glossiness" suffix="_glos" fill="0;0;0" allowSharpen="true"> </value>); 
			newXML.appendChild(<value slot="alpha" suffix="_alpha" fill="255;255;255" allowSharpen="true"> </value>); 
			newXML.appendChild(<value slot="emissive" suffix="_emis" fill="0;0;0" allowSharpen="true"> </value>); 
			newXML.appendChild(<value slot="bump" suffix="_bump" fill="128;128;128" allowSharpen="true"> </value>);
			newXML.appendChild(<value slot="mask (RG)" suffix="_mask" fill_r="128;128;128" fill_g="128;128;128" allowSharpen="true"> </value>);
			newXML.appendChild(<value slot="mask (RGBA)" suffix="_mask" fill_r="128;128;128" fill_g="128;128;128" fill_b="128;128;128" fill_a="128;128;128" allowSharpen="true"> </value>);
			
			//Alert.show(newXML.toString(), "", mx.controls.Alert.OK);
			ExternalInterface.call("SaveXML", slotsFile, newXML.toString());
		}
		
		// Save default xml.
		public static function SaveDefaultConfig():void
		{
			//
			var newXML:XML = <data/>;
			
			// Texture types.
			newXML.appendChild(<types></types>);
			
			newXML.types.appendChild(<type slot="diffuse" selected="true"></type>);
			
			// Downscale.
			newXML.appendChild(<downscale></downscale>);
			newXML.downscale.appendChild(<ds slot="diffuse" coeff="1"></ds>);
			
			// Alpha.
			newXML.appendChild(<alpha></alpha>);
			newXML.alpha.appendChild(<a slot="diffuse" source=""></a>);
			
			// Options.
			newXML.appendChild(<options></options>);
			newXML.options.appendChild(<outputtype value="tga"></outputtype>);
			newXML.options.appendChild(<nonpow2 selected="false"></nonpow2>);
			newXML.options.appendChild(<sharpencontrast selected="false"></sharpencontrast>);
			newXML.options.appendChild(<onlyexport selected="false"></onlyexport>);
			newXML.options.appendChild(<copytosymmetrypath selected="false"></copytosymmetrypath>);
			
			//
			newXML.appendChild(<downscalehidden value="false"></downscalehidden>);
			newXML.appendChild(<optionshidden value="false"></optionshidden>);
			newXML.appendChild(<lastprojectpath path=""></lastprojectpath>);
			
			ExternalInterface.call("SaveXML", configFile, newXML.toString());
		}
	}
}