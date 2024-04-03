if (not local _this) exitwith {};

clearItemCargoGlobal _this;
clearWeaponCargoGlobal _this;
clearMagazineCargoGlobal _this;
clearBackpackCargoGlobal _this;

_this addItemCargoGlobal ["WOG_TowRope_15m",1];
_this addItemCargoGlobal ["ACE_EntrenchingTool",2];
_this addItemCargoGlobal ["ToolKit",2];

_this addMagazineTurret ["wog_2000Rnd_762x54mmR",[0]];

_this addWeaponCargoGlobal ['rhs_weap_rpg7', 1];
_this addItemCargoGlobal ["rhs_acc_pgo7v3",1];

_this addMagazineCargoGlobal ['rhs_rpg7_PG7VL_mag', 3];
_this addMagazineCargoGlobal ['rhs_rpg7_OG7V_mag', 3];
_this addMagazineCargoGlobal ['rhs_rpg7_PG7VR_mag', 3];

_this addMagazineCargoGlobal ['grcb_30Rnd_762x39mm_polymer_7N23', 30];
_this addMagazineCargoGlobal ['rhs_30Rnd_762x39mm_polymer_tracer', 20];
_this addMagazineCargoGlobal ['rhs_100Rnd_762x54mmR_7N13', 3];
_this addMagazineCargoGlobal ['rhs_100Rnd_762x54mmR_7N26', 3];
_this addMagazineCargoGlobal ['rhs_100Rnd_762x54mmR_green', 2];

_this addMagazineCargoGlobal ['rhs_mag_rgd5', 20];
_this addMagazineCargoGlobal ['rhs_mag_rgn', 20];
_this addMagazineCargoGlobal ['rhs_mag_rdg2_white', 20];
_this addMagazineCargoGlobal ['wog_mag_rdgm_white', 20];

_this addWeaponCargoGlobal ['wog_weap_rpg27', 2];
_this addWeaponCargoGlobal ['wog_weap_rpg28', 2];
_this addItemCargoGlobal ['wog_optic_rpg28',2];
_this addWeaponCargoGlobal ['wog_weap_rpom', 2];

_this addItemCargoGlobal ["ACE_quikclot",15];
_this addItemCargoGlobal ["ACE_fieldDressing",15];
_this addItemCargoGlobal ["ACE_packingBandage",15];
_this addItemCargoGlobal ["ACE_elasticBandage",15];
_this addItemCargoGlobal ["ACE_tourniquet",10];
_this addItemCargoGlobal ["ACE_splint",10];
_this addItemCargoGlobal ["ACE_morphine",10];
_this addItemCargoGlobal ["ACE_epinephrine",10];
