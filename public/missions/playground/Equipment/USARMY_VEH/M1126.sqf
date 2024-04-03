if (not local _this) exitwith {};

clearItemCargoGlobal _this;
clearWeaponCargoGlobal _this;
clearMagazineCargoGlobal _this;
clearBackpackCargoGlobal _this;

_this addItemCargoGlobal ["WOG_TowRope_15m",1];
_this addItemCargoGlobal ["ACE_EntrenchingTool",1];
_this addItemCargoGlobal ["ToolKit",1];

_this addMagazineTurret ["rhs_mag_200rnd_127x99_mag_Tracer_Red",[0]];
_this addMagazineCargoGlobal ["ace_csw_rhs_mag_100rnd_127x99_mag_Tracer_Red",15];
_this addMagazineCargoGlobal ["ace_csw_rhs_mag_100rnd_127x99_SLAP_mag_Tracer_Red", 5];

_this addItemCargoGlobal ["ACE_quikclot",15];
_this addItemCargoGlobal ["ACE_fieldDressing",15];
_this addItemCargoGlobal ["ACE_packingBandage",15];
_this addItemCargoGlobal ["ACE_elasticBandage",15];
_this addItemCargoGlobal ["ACE_tourniquet",10];
_this addItemCargoGlobal ["ACE_splint",10];
_this addItemCargoGlobal ["ACE_morphine",10];
_this addItemCargoGlobal ["ACE_epinephrine",10];