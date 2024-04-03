if (not local _this) exitwith {};

clearItemCargoGlobal _this;
clearWeaponCargoGlobal _this;
clearMagazineCargoGlobal _this;
clearBackpackCargoGlobal _this;

_this addBackpackCargoGlobal ["B_Parachute",18];
_this addItemCargoGlobal ["ToolKit",2];

_this addItemCargoGlobal ["ACE_quikclot",15];
_this addItemCargoGlobal ["ACE_fieldDressing",15];
_this addItemCargoGlobal ["ACE_packingBandage",15];
_this addItemCargoGlobal ["ACE_elasticBandage",15];
_this addItemCargoGlobal ["ACE_tourniquet",10];
_this addItemCargoGlobal ["ACE_splint",10];
_this addItemCargoGlobal ["ACE_morphine",10];
_this addItemCargoGlobal ["ACE_epinephrine",10];
_this addItemCargoGlobal ["ACE_personalAidKit",4];
_this addItemCargoGlobal ["ACE_bloodIV_500",10];
_this addItemCargoGlobal ["ACE_bloodIV_250",10];
_this addItemCargoGlobal ["ACE_surgicalKit",1];

_this addEventHandler ["GetIn", {[_this, ["O_Pilot_F"], [[-1], [0]]] execVM "scripts\getIn.sqf"}];
_this addEventHandler ["SeatSwitched", {[_this, ["O_Pilot_F"], [[-1], [0]]] execVM "scripts\seatSwitched.sqf"}];
