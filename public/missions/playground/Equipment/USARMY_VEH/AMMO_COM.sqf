if (not local _this) exitwith {};

clearItemCargoGlobal _this;
clearWeaponCargoGlobal _this;
clearMagazineCargoGlobal _this;
clearBackpackCargoGlobal _this;

_this addItemCargoGlobal ["ACE_EntrenchingTool",4];

_this addMagazineCargoGlobal ["rhs_mag_m67", 20];
_this addMagazineCargoGlobal ["SmokeShell", 20];

_this addWeaponCargoGlobal ['rhs_weap_M136_hedp', 1];
_this addWeaponCargoGlobal ['rhs_weap_M136', 1];

_this addMagazineCargoGlobal ["rhs_mag_30Rnd_556x45_Mk318_PMAG",30];
_this addMagazineCargoGlobal ["rhs_mag_30Rnd_556x45_M855A1_PMAG_Tracer_Red",20];

_this addWeaponCargoGlobal ['rhs_weap_fim92', 8];

