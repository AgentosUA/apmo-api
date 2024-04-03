params ["_EHparams", "_units", "_turrets"];

_vehicle = _EHparams #0;
_unit = _EHparams #2;

if ((_vehicle unitTurret _unit in _turrets) && !(typeOf _unit in _units)) then {
	moveOut _unit;
	if (local _unit) then {
		hint "Вы не можете управлять этой техникой";
	} else {
		[[_unit], {
			params ["_unit"];
			{hint "Вы не можете управлять этой техникой";} remoteExec ["call", (owner _unit)];
		}] remoteExec ["call", 2];
	};
};