waituntil {!isnil "bis_fnc_init"};

[] call wmt_fnc_briefingmap;

[] execVM "briefing.sqf";

if (isServer) then {
    [
        {
            (mortar_stryker getVariable "ace_cargo_space") >= 52
        },
        {
            for "_x" from 1 to 25 do {["BWA3_box_120mm_Mo_HE", mortar_stryker] call ace_cargo_fnc_loadItem;};
        }
    ] call CBA_fnc_waitUntilAndExecute;
};

null = ["mZone_0", trg_mZone_0, 600, EAST] execVM "Scripts\NSA_CapAndHold_forWMT.sqf";

call compile preprocessFile "Scripts\randomizeFace.sqf";
if (isServer) then {
    call randomizeFace;
    call SetFaces;
};

enableEngineArtillery false;

/////////////////////MISSION///SPECIFIC/////////////////////

wog3_no_auto_long_range_radio = true;

private ["_rank", "_namestr", "_str_1", "_str_2", "_str_3"];

switch (rank player) do {
	if (playerSide == east) then {
		case "MAJOR": { _rank = "М-р" };
		case "CAPTAIN": { _rank = "К-н" };
		case "LIEUTENANT": { _rank = "Л-т" };
		case "SERGEANT": { _rank = "С-т" };
		case "CORPORAL": { _rank = "Ефр" };
		case "PRIVATE": { _rank = "Ряд" };
		default { hint "default" };
	} else {
		case "MAJOR": { _rank = "Maj" };
		case "CAPTAIN": { _rank = "Cpt" };
		case "LIEUTENANT": { _rank = "Lt" };
		case "SERGEANT": { _rank = "Sgt" };
		case "CORPORAL": { _rank = "Cpl" };
		case "PRIVATE": { _rank = "Pvt" };
		default { hint "default" };
	};
};

if (playerSide == east) then {
	_str_1 = "Алтис";
	_str_2 = "Селеста";
	_str_3 = "9 июля 2020 года";
	_namestr = _rank + " " + profileName;
} else {
	_str_1 = "Altis";
	_str_2 = "Selesta";
	_str_3 = "Jule 9, 2020";
	_namestr = _rank + " " + profileName;
};

waitUntil {WMT_pub_frzstate > 2};
sleep 10;

[_str_1, _str_2, _namestr, _str_3] spawn BIS_fnc_infoText;