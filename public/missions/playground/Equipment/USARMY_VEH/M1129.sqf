if (not local _this) exitwith {};

clearItemCargoGlobal _this;
clearWeaponCargoGlobal _this;
clearMagazineCargoGlobal _this;
clearBackpackCargoGlobal _this;

_this addItemCargoGlobal ["WOG_TowRope_15m",1];
_this addItemCargoGlobal ["ACE_EntrenchingTool",1];
_this addItemCargoGlobal ["ACE_artilleryTable",2];
_this addItemCargoGlobal ["ACE_MapTools",2];
_this addItemCargoGlobal ["ToolKit",1];

_this addMagazineTurret ["RHS_96Rnd_40mm_MK19_M430A1",[1]];
_this addMagazineCargoGlobal ["ace_csw_RHS_48Rnd_40mm_MK19_M430A1",10];
_this addMagazineCargoGlobal ["BWA3_1Rnd_120mm_Mo_shells",10];