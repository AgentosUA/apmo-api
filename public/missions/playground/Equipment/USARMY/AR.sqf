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
_this addVest 'rhsusf_iotv_ocp_SAW';
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_mag_m67';};
for '_i' from 1 to 2 do { _this addItemToVest 'rhsusf_200Rnd_556x45_mixed_soft_pouch_coyote';};
_this addBackpack 'rhsusf_assault_eagleaiii_ocp';
for '_i' from 1 to 2 do { _this addItemToBackpack  'rhsusf_200Rnd_556x45_mixed_soft_pouch_coyote';};
for '_i' from 1 to 2 do { _this addItemToBackpack  'rhsusf_100Rnd_556x45_M995_soft_pouch_coyote';};

_this addWeapon 'rhs_weap_m249_pip_S';
_this addPrimaryWeaponItem 'iansky_specterdrkf_2D';
_this addPrimaryWeaponItem 'rhsusf_acc_grip1';
_this addPrimaryWeaponItem 'rhsusf_200Rnd_556x45_mixed_soft_pouch_coyote';

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
