if (not local _this) exitwith {};

clearItemCargoGlobal _this;
clearWeaponCargoGlobal _this;
clearMagazineCargoGlobal _this;
clearBackpackCargoGlobal _this;

_this addItemCargoGlobal ["WOG_TowRope_15m",1];
_this addItemCargoGlobal ["ACE_EntrenchingTool",1];
_this addItemCargoGlobal ["ToolKit",2];

_this addMagazineTurret ["rhs_mag_100rnd_127x99_mag_Tracer_Red",[0,0]];
_this addMagazineTurret ["wog_200Rnd_762x51_m80a1epr",[0,2]];
_this addMagazineTurret ["wog_1200Rnd_762x51_m80a1epr",[0]];
_this addMagazineTurret ["rhs_mag_200rnd_127x99_SLAP_mag_Tracer_Red",[0]];
_this addMagazineCargoGlobal ["ace_csw_rhs_mag_100rnd_127x99_mag_Tracer_Red",9];
_this addMagazineCargoGlobal ["rhsusf_100Rnd_762x51_m80a1epr",16];
_this addMagazineCargoGlobal ["wog_csw_mag_M829A2",20];
_this addMagazineCargoGlobal ["wog_csw_mag_M830",16];

_this addEventHandler ["GetIn", {[_this, ["B_crew_F"], [[-1], [0]]] execVM "scripts\getIn.sqf"}];
_this addEventHandler ["SeatSwitched", {[_this, ["B_crew_F"], [[-1], [0]]] execVM "scripts\seatSwitched.sqf"}];