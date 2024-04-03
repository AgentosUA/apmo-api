if (not local _this) exitwith {};

clearItemCargoGlobal _this;
clearWeaponCargoGlobal _this;
clearMagazineCargoGlobal _this;
clearBackpackCargoGlobal _this;

_this addItemCargoGlobal ["WOG_TowRope_15m",1];
_this addItemCargoGlobal ["ACE_EntrenchingTool",2];
_this addItemCargoGlobal ["ToolKit",2];

_this addMagazineCargoGlobal ['rhs_30Rnd_545x39_7N22_AK', 10];
_this addMagazineCargoGlobal ['wog_rhs_30Rnd_545x39_7N10_AK_tracers', 5];

_this addMagazineCargoGlobal ['rhs_mag_rgd5', 10];
_this addMagazineCargoGlobal ['rhs_mag_rdg2_white', 10];

_this addEventHandler ["GetIn", {[_this, ["O_crew_F"], [[-1], [0]]] execVM "scripts\getIn.sqf"}];
_this addEventHandler ["SeatSwitched", {[_this, ["O_crew_F"], [[-1], [0]]] execVM "scripts\seatSwitched.sqf"}];