if (not local _this) exitwith {};

removeAllWeapons _this;
removeAllItems _this;
removeAllAssignedItems _this;
removeUniform _this;
removeVest _this;
removeBackpack _this;
removeHeadgear _this;
removeGoggles _this;

_this forceAddUniform 'rhs_uniform_6sh122_gloves_v1';
_this addItemToUniform 'ACE_EarPlugs';
_this addItemToUniform 'ACE_MapTools';
_this addVest 'rhs_6b45_rifleman';
_this addItemToVest 'ACE_RangeCard';
_this addItemToVest 'ACE_Kestrel4500';
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_mag_rgd5';};
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_mag_rgn';};
for '_i' from 1 to 2 do { _this addItemToVest 'rhs_mag_rdg2_white';};
for '_i' from 1 to 3 do { _this addItemToVest 'rhs_mag_9x19_17';};
for '_i' from 1 to 7 do { _this addItemToVest 'rhs_10Rnd_762x54mmR_7N14';};
for '_i' from 1 to 3 do { _this addItemToVest 'rhs_10Rnd_762x54mmR_T_46M';};
_this addBackpack 'CUP_O_RUS_Patrol_bag_Summer';
for '_i' from 1 to 4 do { _this addItemToBackpack  'rhs_10Rnd_762x54mmR_7N14';};
for '_i' from 1 to 2 do { _this addItemToBackpack  'rhs_10Rnd_762x54mmR_T_46M';};
_this addWeapon 'rhs_weap_svdp_wd_npz';
_this addPrimaryWeaponItem 'rhs_acc_dh520x56';
_this addWeapon 'rhs_weap_pya';
_this addHeadgear 'rhs_6b47_bala';

_this linkItem 'ItemMap';
_this linkItem 'ItemCompass';
_this linkItem 'ItemWatch';
_this linkItem 'ItemRadio';
_this addWeapon 'rhs_pdu4';


