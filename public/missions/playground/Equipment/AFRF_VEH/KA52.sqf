if (not local _this) exitwith {};

clearItemCargoGlobal _this;
clearWeaponCargoGlobal _this;
clearMagazineCargoGlobal _this;
clearBackpackCargoGlobal _this;

_this addBackpackCargoGlobal ["B_Parachute",2];
_this addItemCargoGlobal ["ToolKit",1];

_this addEventHandler ["GetIn", {[_this, ["O_Pilot_F"], [[-1], [0]]] execVM "scripts\getIn.sqf"}];
_this addEventHandler ["SeatSwitched", {[_this, ["O_Pilot_F"], [[-1], [0]]] execVM "scripts\seatSwitched.sqf"}];
