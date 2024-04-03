if (not local _this) exitwith {};

clearItemCargoGlobal _this;
clearWeaponCargoGlobal _this;
clearMagazineCargoGlobal _this;
clearBackpackCargoGlobal _this;

_this addItemCargoGlobal ["WOG_TowRope_15m",1];
_this addItemCargoGlobal ["ACE_EntrenchingTool",4];

_this addMagazineCargoGlobal ['rhs_30Rnd_545x39_7N22_AK', 40];
_this addMagazineCargoGlobal ['wog_rhs_30Rnd_545x39_7N10_AK_tracers', 20];
_this addMagazineCargoGlobal ['rhs_100Rnd_762x54mmR_7N13', 6];
_this addMagazineCargoGlobal ['rhs_100Rnd_762x54mmR_7N26', 6];
_this addMagazineCargoGlobal ['rhs_100Rnd_762x54mmR_green', 4];

_this addMagazineCargoGlobal ['rhs_mag_rgd5', 30];
_this addMagazineCargoGlobal ['rhs_mag_rgn', 30];
_this addMagazineCargoGlobal ['rhs_mag_rdg2_white', 20];

_this addWeaponCargoGlobal ['wog_weap_rpg27', 2];
_this addWeaponCargoGlobal ['wog_weap_rpg28', 2];
_this addWeaponCargoGlobal ['rhs_weap_rshg2', 3];
_this addItemCargoGlobal ['wog_optic_rpg28',2];

_this addItemCargoGlobal ["ACE_quikclot",15];
_this addItemCargoGlobal ["ACE_fieldDressing",15];
_this addItemCargoGlobal ["ACE_packingBandage",15];
_this addItemCargoGlobal ["ACE_elasticBandage",15];
_this addItemCargoGlobal ["ACE_tourniquet",10];
_this addItemCargoGlobal ["ACE_splint",10];
_this addItemCargoGlobal ["ACE_morphine",10];
_this addItemCargoGlobal ["ACE_epinephrine",10];