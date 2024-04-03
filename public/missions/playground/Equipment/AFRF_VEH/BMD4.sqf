if (not local _this) exitwith {};

clearItemCargoGlobal _this;
clearWeaponCargoGlobal _this;
clearMagazineCargoGlobal _this;
clearBackpackCargoGlobal _this;

_this addItemCargoGlobal ["WOG_TowRope_15m",1];
_this addItemCargoGlobal ["ACE_EntrenchingTool",2];
_this addItemCargoGlobal ["ToolKit",2];

_this addMagazineCargoGlobal ['rhs_30Rnd_545x39_7N22_AK', 30];
_this addMagazineCargoGlobal ['wog_rhs_30Rnd_545x39_7N10_AK_tracers', 20];
_this addMagazineCargoGlobal ['rhs_100Rnd_762x54mmR_7N13', 3];
_this addMagazineCargoGlobal ['rhs_100Rnd_762x54mmR_7N26', 3];
_this addMagazineCargoGlobal ['rhs_100Rnd_762x54mmR_green', 2];

_this addMagazineCargoGlobal ['rhs_mag_rgd5', 20];
_this addMagazineCargoGlobal ['rhs_mag_rgn', 20];
_this addMagazineCargoGlobal ['rhs_mag_rdg2_white', 20];

_this addWeaponCargoGlobal ['wog_weap_rpg27', 1];
_this addWeaponCargoGlobal ['wog_weap_rpg28', 1];
_this addWeaponCargoGlobal ['rhs_weap_rshg2', 2];
_this addItemCargoGlobal ['wog_optic_rpg28',1];

_this addItemCargoGlobal ["ACE_quikclot",15];
_this addItemCargoGlobal ["ACE_fieldDressing",15];
_this addItemCargoGlobal ["ACE_packingBandage",15];
_this addItemCargoGlobal ["ACE_elasticBandage",15];
_this addItemCargoGlobal ["ACE_tourniquet",10];
_this addItemCargoGlobal ["ACE_splint",10];
_this addItemCargoGlobal ["ACE_morphine",10];
_this addItemCargoGlobal ["ACE_epinephrine",10];

_this addEventHandler ["GetIn", {[_this, ["O_crew_F", "O_Soldier_SL_F", "O_officer_F"], [[-1], [0]]] execVM "scripts\getIn.sqf"}];
_this addEventHandler ["SeatSwitched", {[_this, ["O_crew_F", "O_Soldier_SL_F", "O_officer_F"], [[-1], [0]]] execVM "scripts\seatSwitched.sqf"}];