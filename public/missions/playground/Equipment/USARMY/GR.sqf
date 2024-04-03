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
_this addVest 'rhsusf_iotv_ocp_Grenadier';
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_mag_m67';};
for '_i' from 1 to 5 do { _this addItemToVest 'rhs_mag_30Rnd_556x45_Mk318_PMAG';};
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_mag_30Rnd_556x45_M855A1_PMAG_Tracer_Red';};
for '_i' from 1 to 6 do { _this addItemToVest 'rhs_mag_M433_HEDP';};
_this addBackpack 'rhsusf_assault_eagleaiii_ocp';
_this addItemToBackpack  'ACE_HuntIR_monitor';
for '_i' from 1 to 10 do { _this addItemToBackpack  'rhs_mag_M441_HE';};
for '_i' from 1 to 2 do { _this addItemToBackpack  'rhs_mag_m714_White';};
for '_i' from 1 to 2 do { _this addItemToBackpack  'rhs_mag_m713_Red';};
for '_i' from 1 to 4 do { _this addItemToBackpack  'rhs_mag_M433_HEDP';};
for '_i' from 1 to 6 do { _this addItemToBackpack  'ACE_HuntIR_M203';};

_this addWeapon 'rhs_weap_m4a1_blockII_M203_bk';
_this addPrimaryWeaponItem 'rhsusf_acc_eotech_552';
_this addPrimaryWeaponItem 'rhs_mag_30Rnd_556x45_Mk318_PMAG';

_Headgear = ['rhsusf_ach_helmet_headset_ocp_alt',
'rhsusf_ach_helmet_headset_ess_ocp',
'rhsusf_ach_helmet_headset_ocp',
'rhsusf_ach_helmet_headset_ocp',
'rhsusf_ach_helmet_headset_ocp_alt',
'rhsusf_ach_helmet_headset_ess_ocp_alt'] call BIS_fnc_selectRandom;
_this addHeadgear _Headgear;
_this addGoggles 'rhs_googles_black';

_this linkItem 'ItemMap';
_this linkItem 'ItemCompass';
_this linkItem 'ItemRadio';
_this linkItem 'tf_microdagr';
