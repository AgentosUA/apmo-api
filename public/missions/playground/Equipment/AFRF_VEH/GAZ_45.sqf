if (not local _this) exitwith {};

clearItemCargoGlobal _this;
clearWeaponCargoGlobal _this;
clearMagazineCargoGlobal _this;
clearBackpackCargoGlobal _this;

_this addItemCargoGlobal ["WOG_TowRope_15m",1];
_this addItemCargoGlobal ["ACE_EntrenchingTool",2];
_this addItemCargoGlobal ["ACE_RangeTable_AGS30",1];

_this addMagazineTurret ["wog_100Rnd_762x54mmR",[0]];
_this addMagazineTurret ["RHS_mag_VOG30_30",[1]];
_this addMagazineCargoGlobal ["rhs_100Rnd_762x54mmR",18];
_this addMagazineCargoGlobal ["ace_csw_RHS_mag_VOG30_30",11];

_this addMagazineCargoGlobal ['grcb_30Rnd_762x39mm_polymer_7N23', 20];
_this addMagazineCargoGlobal ['rhs_30Rnd_762x39mm_polymer_tracer', 10];
_this addMagazineCargoGlobal ['rhs_100Rnd_762x54mmR_7N13', 2];
_this addMagazineCargoGlobal ['rhs_100Rnd_762x54mmR_7N26', 2];
_this addMagazineCargoGlobal ['rhs_100Rnd_762x54mmR_green', 1];
_this addMagazineCargoGlobal ['rhs_5Rnd_338lapua_t5000', 10];

_this addMagazineCargoGlobal ['rhs_mag_rgd5', 15];
_this addMagazineCargoGlobal ['rhs_mag_rgn', 15];
_this addMagazineCargoGlobal ['rhs_mag_rdg2_white', 10];
_this addMagazineCargoGlobal ['wog_mag_rdgm_white', 10];

_this addItemCargoGlobal ["ACE_quikclot",15];
_this addItemCargoGlobal ["ACE_fieldDressing",15];
_this addItemCargoGlobal ["ACE_packingBandage",15];
_this addItemCargoGlobal ["ACE_elasticBandage",15];
_this addItemCargoGlobal ["ACE_tourniquet",10];
_this addItemCargoGlobal ["ACE_splint",10];
_this addItemCargoGlobal ["ACE_morphine",10];
_this addItemCargoGlobal ["ACE_epinephrine",10];
