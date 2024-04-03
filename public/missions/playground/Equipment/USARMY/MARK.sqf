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
_this addVest 'rhsusf_iotv_ocp_Rifleman';
for '_i' from 1 to 4 do { _this addItemToVest 'rhs_mag_m67';};
_this addItemToVest 'ACE_Kestrel4500';
_this addItemToVest 'ACE_RangeCard';
for '_i' from 1 to 2 do { _this addItemToVest 'rhsusf_20Rnd_762x51_SR25_m118_special_Mag';};
for '_i' from 1 to 2 do { _this addItemToVest 'rhsusf_20Rnd_762x51_SR25_m993_Mag';};
for '_i' from 1 to 2 do { _this addItemToVest 'rhsusf_20Rnd_762x51_SR25_m62_Mag';};
_this addBackpack 'rhsusf_assault_eagleaiii_ocp';
for '_i' from 1 to 4 do { _this addItemToBackpack  'rhsusf_20Rnd_762x51_SR25_m118_special_Mag';};
for '_i' from 1 to 2 do { _this addItemToBackpack  'rhsusf_20Rnd_762x51_SR25_m62_Mag';};
for '_i' from 1 to 4 do { _this addItemToBackpack  'rhsusf_20Rnd_762x51_SR25_m993_Mag';};
_this addWeapon 'rhs_weap_sr25_d';
_this addPrimaryWeaponItem 'rhsusf_acc_SR25S_d';
_this addPrimaryWeaponItem 'BWA3_bipod_Harris_tan';
_this addPrimaryWeaponItem 'rhsusf_acc_LEUPOLDMK4_2_d';

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
_this addWeapon 'ACE_Vector';
