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
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_mag_m67';};
for '_i' from 1 to 5 do { _this addItemToVest 'rhs_mag_30Rnd_556x45_Mk318_PMAG';};
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_mag_30Rnd_556x45_M855A1_PMAG_Tracer_Red';};
_this addBackpack 'rhsusf_assault_eagleaiii_ocp';
_this addItemToBackpack 'ACE_UAVBattery';

_this addWeapon 'rhs_weap_m4a1_blockII_bk';
_this addPrimaryWeaponItem 'rhsusf_acc_anpeq15_bk_top';
_this addPrimaryWeaponItem 'rhsusf_acc_eotech_552';
_this addPrimaryWeaponItem 'rhsusf_acc_grip1';
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
_this linkItem 'B_UavTerminal';