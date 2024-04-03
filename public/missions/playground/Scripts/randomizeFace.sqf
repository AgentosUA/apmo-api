randomizeFace={
    fListBlue=["GreekHead_A3_13",
            "GreekHead_A3_09",
            "GreekHead_A3_02",
            "GreekHead_A3_06",
			"GreekHead_A3_07",
			"GreekHead_A3_01",
            "WhiteHead_01",
            "WhiteHead_08",
            "WhiteHead_05",
            "WhiteHead_17",
			"WhiteHead_20",
			"WhiteHead_13",
			"WhiteHead_21",
			"WhiteHead_17",
			"WhiteHead_19",
			"WhiteHead_23",
			"WhiteHead_10",
			"WhiteHead_11",
			"AsianHead_A3_01",
			"AsianHead_A3_02",
			"AsianHead_A3_03",
			"AsianHead_A3_04",
            "AfricanHead_03",
            "AfricanHead_02"];
    fListRed=["Kerry",
            "WhiteHead_01",
            "WhiteHead_08",
			"WhiteHead_06",
			"WhiteHead_09",
            "WhiteHead_07",
            "GreekHead_A3_05",
            "GreekHead_A3_08",
            "WhiteHead_04",
			"WhiteHead_05",
			"WhiteHead_16",
			"WhiteHead_11",
			"WhiteHead_15",
			"WhiteHead_14"];
    PlayersFaces=[];

    {
        if (side _x == WEST) then {
            PlayersFaces pushback [_X,(selectRandom fListBlue)];};
        if (side _x == EAST) then {
            PlayersFaces pushback [_X,(selectRandom fListRed)];};
    } foreach allunits; 
};

SetFaces={
        {    [(_x select 0),(_x select 1)]remoteExec["setFace",0,true]; 
                diag_log format ["bot %1 face %2",(_x select 0),(_x select 1)];

        } foreach PlayersFaces;
};