if (not local _this) exitwith {};

removeAllWeapons _this;
removeAllItems _this;
removeAllAssignedItems _this;
removeUniform _this;
removeVest _this;
removeBackpack _this;
removeHeadgear _this;
removeGoggles _this;

_this forceAddUniform 'rhs_uniform_cu_ocp';
_this addItemToUniform 'ACE_EarPlugs';
for '_i' from 1 to 2 do { _this addItemToUniform 'SmokeShell';};
_this addVest 'rhsusf_iotv_ocp_Repair';
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_mag_m67';};
for '_i' from 1 to 5 do { _this addItemToVest 'rhs_mag_30Rnd_556x45_Mk318_PMAG';};
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_mag_30Rnd_556x45_M855A1_PMAG_Tracer_Red';};
_this addBackpack 'rhsusf_assault_eagleaiii_ocp';
for '_i' from 1 to 2 do { _this addItemToBackpack  'ToolKit';};

_this addWeapon 'rhs_weap_m4a1_carryhandle';
_this addPrimaryWeaponItem 'rhs_mag_30Rnd_556x45_Mk318_PMAG';

_Headgear = ['rhsusf_cvc_helmet',
'rhsusf_cvc_helmet',
'rhsusf_cvc_alt_helmet',
'rhsusf_cvc_alt_helmet',
'rhsusf_cvc_ess'] call BIS_fnc_selectRandom;
_this addHeadgear _Headgear;
_this addGoggles 'rhs_googles_black';

_this linkItem 'ItemMap';
_this linkItem 'ItemCompass';
_this linkItem 'ItemRadio';
_this linkItem 'tf_microdagr';
_this linkItem 'ItemGPS';
