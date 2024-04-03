if (not local _this) exitwith {};

clearItemCargoGlobal _this;
clearWeaponCargoGlobal _this;
clearMagazineCargoGlobal _this;
clearBackpackCargoGlobal _this;

_this addItemCargoGlobal ["ACE_EntrenchingTool",1];

_this addMagazineCargoGlobal ["rhs_mag_m67", 10];
_this addMagazineCargoGlobal ["SmokeShell", 10];

_this addMagazineCargoGlobal ["rhs_mag_30Rnd_556x45_Mk318_PMAG",10];
_this addMagazineCargoGlobal ["rhs_mag_30Rnd_556x45_M855A1_PMAG_Tracer_Red",6];
_this addMagazineCargoGlobal ["rhs_mag_M441_HE",6];
_this addMagazineCargoGlobal ["rhs_mag_M433_HEDP",6];