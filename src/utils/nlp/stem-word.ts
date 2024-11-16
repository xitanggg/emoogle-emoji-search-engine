// @ts-nocheck
/*
	Except where explicitly noted, all the software given out on this Snowball site
	is covered by the 3-clause BSD License:

	Copyright (c) 2001, Dr Martin Porter,
	Copyright (c) 2002, Richard Boulton.
	All rights reserved.

	Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

	1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
	
	2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
	
	3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
	
	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

// Original source code link: https://github.com/snowballstem/snowball-website/blob/main/js/base-stemmer.js
/**@constructor*/
const BaseStemmer = function () {
	/** @protected */
	this.current = '';
	this.cursor = 0;
	this.limit = 0;
	this.limit_backward = 0;
	this.bra = 0;
	this.ket = 0;

	/**
	 * @param {string} value
	 */
	this.setCurrent = function (value) {
		this.current = value;
		this.cursor = 0;
		this.limit = this.current.length;
		this.limit_backward = 0;
		this.bra = this.cursor;
		this.ket = this.limit;
	};

	/**
	 * @return {string}
	 */
	this.getCurrent = function () {
		return this.current;
	};

	/**
	 * @param {BaseStemmer} other
	 */
	this.copy_from = function (other) {
		/** @protected */
		this.current = other.current;
		this.cursor = other.cursor;
		this.limit = other.limit;
		this.limit_backward = other.limit_backward;
		this.bra = other.bra;
		this.ket = other.ket;
	};

	/**
	 * @param {number[]} s
	 * @param {number} min
	 * @param {number} max
	 * @return {boolean}
	 */
	this.in_grouping = function (s, min, max) {
		/** @protected */
		if (this.cursor >= this.limit) return false;
		var ch = this.current.charCodeAt(this.cursor);
		if (ch > max || ch < min) return false;
		ch -= min;
		if ((s[ch >>> 3] & (0x1 << (ch & 0x7))) == 0) return false;
		this.cursor++;
		return true;
	};

	/**
	 * @param {number[]} s
	 * @param {number} min
	 * @param {number} max
	 * @return {boolean}
	 */
	this.in_grouping_b = function (s, min, max) {
		/** @protected */
		if (this.cursor <= this.limit_backward) return false;
		var ch = this.current.charCodeAt(this.cursor - 1);
		if (ch > max || ch < min) return false;
		ch -= min;
		if ((s[ch >>> 3] & (0x1 << (ch & 0x7))) == 0) return false;
		this.cursor--;
		return true;
	};

	/**
	 * @param {number[]} s
	 * @param {number} min
	 * @param {number} max
	 * @return {boolean}
	 */
	this.out_grouping = function (s, min, max) {
		/** @protected */
		if (this.cursor >= this.limit) return false;
		var ch = this.current.charCodeAt(this.cursor);
		if (ch > max || ch < min) {
			this.cursor++;
			return true;
		}
		ch -= min;
		if ((s[ch >>> 3] & (0x1 << (ch & 0x7))) == 0) {
			this.cursor++;
			return true;
		}
		return false;
	};

	/**
	 * @param {number[]} s
	 * @param {number} min
	 * @param {number} max
	 * @return {boolean}
	 */
	this.out_grouping_b = function (s, min, max) {
		/** @protected */
		if (this.cursor <= this.limit_backward) return false;
		var ch = this.current.charCodeAt(this.cursor - 1);
		if (ch > max || ch < min) {
			this.cursor--;
			return true;
		}
		ch -= min;
		if ((s[ch >>> 3] & (0x1 << (ch & 0x7))) == 0) {
			this.cursor--;
			return true;
		}
		return false;
	};

	/**
	 * @param {string} s
	 * @return {boolean}
	 */
	this.eq_s = function (s) {
		/** @protected */
		if (this.limit - this.cursor < s.length) return false;
		if (this.current.slice(this.cursor, this.cursor + s.length) != s) {
			return false;
		}
		this.cursor += s.length;
		return true;
	};

	/**
	 * @param {string} s
	 * @return {boolean}
	 */
	this.eq_s_b = function (s) {
		/** @protected */
		if (this.cursor - this.limit_backward < s.length) return false;
		if (this.current.slice(this.cursor - s.length, this.cursor) != s) {
			return false;
		}
		this.cursor -= s.length;
		return true;
	};

	/**
	 * @param {Among[]} v
	 * @return {number}
	 */
	this.find_among = function (v) {
		/** @protected */
		var i = 0;
		var j = v.length;

		var c = this.cursor;
		var l = this.limit;

		var common_i = 0;
		var common_j = 0;

		var first_key_inspected = false;

		while (true) {
			var k = i + ((j - i) >>> 1);
			var diff = 0;
			var common = common_i < common_j ? common_i : common_j; // smaller
			// w[0]: string, w[1]: substring_i, w[2]: result, w[3]: function (optional)
			var w = v[k];
			var i2;
			for (i2 = common; i2 < w[0].length; i2++) {
				if (c + common == l) {
					diff = -1;
					break;
				}
				diff = this.current.charCodeAt(c + common) - w[0].charCodeAt(i2);
				if (diff != 0) break;
				common++;
			}
			if (diff < 0) {
				j = k;
				common_j = common;
			} else {
				i = k;
				common_i = common;
			}
			if (j - i <= 1) {
				if (i > 0) break; // v->s has been inspected
				if (j == i) break; // only one item in v

				// - but now we need to go round once more to get
				// v->s inspected. This looks messy, but is actually
				// the optimal approach.

				if (first_key_inspected) break;
				first_key_inspected = true;
			}
		}
		do {
			var w = v[i];
			if (common_i >= w[0].length) {
				this.cursor = c + w[0].length;
				if (w.length < 4) return w[2];
				var res = w[3](this);
				this.cursor = c + w[0].length;
				if (res) return w[2];
			}
			i = w[1];
		} while (i >= 0);
		return 0;
	};

	// find_among_b is for backwards processing. Same comments apply
	/**
	 * @param {Among[]} v
	 * @return {number}
	 */
	this.find_among_b = function (v) {
		/** @protected */
		var i = 0;
		var j = v.length;

		var c = this.cursor;
		var lb = this.limit_backward;

		var common_i = 0;
		var common_j = 0;

		var first_key_inspected = false;

		while (true) {
			var k = i + ((j - i) >> 1);
			var diff = 0;
			var common = common_i < common_j ? common_i : common_j;
			var w = v[k];
			var i2;
			for (i2 = w[0].length - 1 - common; i2 >= 0; i2--) {
				if (c - common == lb) {
					diff = -1;
					break;
				}
				diff = this.current.charCodeAt(c - 1 - common) - w[0].charCodeAt(i2);
				if (diff != 0) break;
				common++;
			}
			if (diff < 0) {
				j = k;
				common_j = common;
			} else {
				i = k;
				common_i = common;
			}
			if (j - i <= 1) {
				if (i > 0) break;
				if (j == i) break;
				if (first_key_inspected) break;
				first_key_inspected = true;
			}
		}
		do {
			var w = v[i];
			if (common_i >= w[0].length) {
				this.cursor = c - w[0].length;
				if (w.length < 4) return w[2];
				var res = w[3](this);
				this.cursor = c - w[0].length;
				if (res) return w[2];
			}
			i = w[1];
		} while (i >= 0);
		return 0;
	};

	/* to replace chars between c_bra and c_ket in this.current by the
	 * chars in s.
	 */
	/**
	 * @param {number} c_bra
	 * @param {number} c_ket
	 * @param {string} s
	 * @return {number}
	 */
	this.replace_s = function (c_bra, c_ket, s) {
		/** @protected */
		var adjustment = s.length - (c_ket - c_bra);
		this.current = this.current.slice(0, c_bra) + s + this.current.slice(c_ket);
		this.limit += adjustment;
		if (this.cursor >= c_ket) this.cursor += adjustment;
		else if (this.cursor > c_bra) this.cursor = c_bra;
		return adjustment;
	};

	/**
	 * @return {boolean}
	 */
	this.slice_check = function () {
		/** @protected */
		if (
			this.bra < 0 ||
			this.bra > this.ket ||
			this.ket > this.limit ||
			this.limit > this.current.length
		) {
			return false;
		}
		return true;
	};

	/**
	 * @param {number} c_bra
	 * @return {boolean}
	 */
	this.slice_from = function (s) {
		/** @protected */
		var result = false;
		if (this.slice_check()) {
			this.replace_s(this.bra, this.ket, s);
			result = true;
		}
		return result;
	};

	/**
	 * @return {boolean}
	 */
	this.slice_del = function () {
		/** @protected */
		return this.slice_from('');
	};

	/**
	 * @param {number} c_bra
	 * @param {number} c_ket
	 * @param {string} s
	 */
	this.insert = function (c_bra, c_ket, s) {
		/** @protected */
		var adjustment = this.replace_s(c_bra, c_ket, s);
		if (c_bra <= this.bra) this.bra += adjustment;
		if (c_bra <= this.ket) this.ket += adjustment;
	};

	/**
	 * @return {string}
	 */
	this.slice_to = function () {
		/** @protected */
		var result = '';
		if (this.slice_check()) {
			result = this.current.slice(this.bra, this.ket);
		}
		return result;
	};

	/**
	 * @return {string}
	 */
	this.assign_to = function () {
		/** @protected */
		return this.current.slice(0, this.limit);
	};
};

// Original source code link: https://github.com/snowballstem/snowball-website/blob/main/js/english-stemmer.js
/**@constructor*/
var EnglishStemmer = function () {
	var base = new BaseStemmer();
	/** @const */ var a_0 = [
		['arsen', -1, -1],
		['commun', -1, -1],
		['gener', -1, -1],
	];

	/** @const */ var a_1 = [
		["'", -1, 1],
		["'s'", 0, 1],
		["'s", -1, 1],
	];

	/** @const */ var a_2 = [
		['ied', -1, 2],
		['s', -1, 3],
		['ies', 1, 2],
		['sses', 1, 1],
		['ss', 1, -1],
		['us', 1, -1],
	];

	/** @const */ var a_3 = [
		['', -1, 3],
		['bb', 0, 2],
		['dd', 0, 2],
		['ff', 0, 2],
		['gg', 0, 2],
		['bl', 0, 1],
		['mm', 0, 2],
		['nn', 0, 2],
		['pp', 0, 2],
		['rr', 0, 2],
		['at', 0, 1],
		['tt', 0, 2],
		['iz', 0, 1],
	];

	/** @const */ var a_4 = [
		['ed', -1, 2],
		['eed', 0, 1],
		['ing', -1, 2],
		['edly', -1, 2],
		['eedly', 3, 1],
		['ingly', -1, 2],
	];

	/** @const */ var a_5 = [
		['anci', -1, 3],
		['enci', -1, 2],
		['ogi', -1, 13],
		['li', -1, 15],
		['bli', 3, 12],
		['abli', 4, 4],
		['alli', 3, 8],
		['fulli', 3, 9],
		['lessli', 3, 14],
		['ousli', 3, 10],
		['entli', 3, 5],
		['aliti', -1, 8],
		['biliti', -1, 12],
		['iviti', -1, 11],
		['tional', -1, 1],
		['ational', 14, 7],
		['alism', -1, 8],
		['ation', -1, 7],
		['ization', 17, 6],
		['izer', -1, 6],
		['ator', -1, 7],
		['iveness', -1, 11],
		['fulness', -1, 9],
		['ousness', -1, 10],
	];

	/** @const */ var a_6 = [
		['icate', -1, 4],
		['ative', -1, 6],
		['alize', -1, 3],
		['iciti', -1, 4],
		['ical', -1, 4],
		['tional', -1, 1],
		['ational', 5, 2],
		['ful', -1, 5],
		['ness', -1, 5],
	];

	/** @const */ var a_7 = [
		['ic', -1, 1],
		['ance', -1, 1],
		['ence', -1, 1],
		['able', -1, 1],
		['ible', -1, 1],
		['ate', -1, 1],
		['ive', -1, 1],
		['ize', -1, 1],
		['iti', -1, 1],
		['al', -1, 1],
		['ism', -1, 1],
		['ion', -1, 2],
		['er', -1, 1],
		['ous', -1, 1],
		['ant', -1, 1],
		['ent', -1, 1],
		['ment', 15, 1],
		['ement', 16, 1],
	];

	/** @const */ var a_8 = [
		['e', -1, 1],
		['l', -1, 2],
	];

	/** @const */ var a_9 = [
		['succeed', -1, -1],
		['proceed', -1, -1],
		['exceed', -1, -1],
		['canning', -1, -1],
		['inning', -1, -1],
		['earring', -1, -1],
		['herring', -1, -1],
		['outing', -1, -1],
	];

	/** @const */ var a_10 = [
		['andes', -1, -1],
		['atlas', -1, -1],
		['bias', -1, -1],
		['cosmos', -1, -1],
		['dying', -1, 3],
		['early', -1, 9],
		['gently', -1, 7],
		['howe', -1, -1],
		['idly', -1, 6],
		['lying', -1, 4],
		['news', -1, -1],
		['only', -1, 10],
		['singly', -1, 11],
		['skies', -1, 2],
		['skis', -1, 1],
		['sky', -1, -1],
		['tying', -1, 5],
		['ugly', -1, 8],
	];

	/** @const */ var /** Array<int> */ g_aeo = [17, 64];

	/** @const */ var /** Array<int> */ g_v = [17, 65, 16, 1];

	/** @const */ var /** Array<int> */ g_v_WXY = [1, 17, 65, 208, 1];

	/** @const */ var /** Array<int> */ g_valid_LI = [55, 141, 2];

	var /** boolean */ B_Y_found = false;
	var /** number */ I_p2 = 0;
	var /** number */ I_p1 = 0;

	/** @return {boolean} */
	function r_prelude() {
		B_Y_found = false;
		var /** number */ v_1 = base.cursor;
		lab0: {
			base.bra = base.cursor;
			if (!base.eq_s("'")) {
				break lab0;
			}
			base.ket = base.cursor;
			if (!base.slice_del()) {
				return false;
			}
		}
		base.cursor = v_1;
		var /** number */ v_2 = base.cursor;
		lab1: {
			base.bra = base.cursor;
			if (!base.eq_s('y')) {
				break lab1;
			}
			base.ket = base.cursor;
			if (!base.slice_from('Y')) {
				return false;
			}
			B_Y_found = true;
		}
		base.cursor = v_2;
		var /** number */ v_3 = base.cursor;
		lab2: {
			while (true) {
				var /** number */ v_4 = base.cursor;
				lab3: {
					golab4: while (true) {
						var /** number */ v_5 = base.cursor;
						lab5: {
							if (!base.in_grouping(g_v, 97, 121)) {
								break lab5;
							}
							base.bra = base.cursor;
							if (!base.eq_s('y')) {
								break lab5;
							}
							base.ket = base.cursor;
							base.cursor = v_5;
							break golab4;
						}
						base.cursor = v_5;
						if (base.cursor >= base.limit) {
							break lab3;
						}
						base.cursor++;
					}
					if (!base.slice_from('Y')) {
						return false;
					}
					B_Y_found = true;
					continue;
				}
				base.cursor = v_4;
				break;
			}
		}
		base.cursor = v_3;
		return true;
	}

	/** @return {boolean} */
	function r_mark_regions() {
		I_p1 = base.limit;
		I_p2 = base.limit;
		var /** number */ v_1 = base.cursor;
		lab0: {
			lab1: {
				var /** number */ v_2 = base.cursor;
				lab2: {
					if (base.find_among(a_0) == 0) {
						break lab2;
					}
					break lab1;
				}
				base.cursor = v_2;
				golab3: while (true) {
					lab4: {
						if (!base.in_grouping(g_v, 97, 121)) {
							break lab4;
						}
						break golab3;
					}
					if (base.cursor >= base.limit) {
						break lab0;
					}
					base.cursor++;
				}
				golab5: while (true) {
					lab6: {
						if (!base.out_grouping(g_v, 97, 121)) {
							break lab6;
						}
						break golab5;
					}
					if (base.cursor >= base.limit) {
						break lab0;
					}
					base.cursor++;
				}
			}
			I_p1 = base.cursor;
			golab7: while (true) {
				lab8: {
					if (!base.in_grouping(g_v, 97, 121)) {
						break lab8;
					}
					break golab7;
				}
				if (base.cursor >= base.limit) {
					break lab0;
				}
				base.cursor++;
			}
			golab9: while (true) {
				lab10: {
					if (!base.out_grouping(g_v, 97, 121)) {
						break lab10;
					}
					break golab9;
				}
				if (base.cursor >= base.limit) {
					break lab0;
				}
				base.cursor++;
			}
			I_p2 = base.cursor;
		}
		base.cursor = v_1;
		return true;
	}

	/** @return {boolean} */
	function r_shortv() {
		lab0: {
			var /** number */ v_1 = base.limit - base.cursor;
			lab1: {
				if (!base.out_grouping_b(g_v_WXY, 89, 121)) {
					break lab1;
				}
				if (!base.in_grouping_b(g_v, 97, 121)) {
					break lab1;
				}
				if (!base.out_grouping_b(g_v, 97, 121)) {
					break lab1;
				}
				break lab0;
			}
			base.cursor = base.limit - v_1;
			if (!base.out_grouping_b(g_v, 97, 121)) {
				return false;
			}
			if (!base.in_grouping_b(g_v, 97, 121)) {
				return false;
			}
			if (base.cursor > base.limit_backward) {
				return false;
			}
		}
		return true;
	}

	/** @return {boolean} */
	function r_R1() {
		return I_p1 <= base.cursor;
	}

	/** @return {boolean} */
	function r_R2() {
		return I_p2 <= base.cursor;
	}

	/** @return {boolean} */
	function r_Step_1a() {
		var /** number */ among_var;
		var /** number */ v_1 = base.limit - base.cursor;
		lab0: {
			base.ket = base.cursor;
			if (base.find_among_b(a_1) == 0) {
				base.cursor = base.limit - v_1;
				break lab0;
			}
			base.bra = base.cursor;
			if (!base.slice_del()) {
				return false;
			}
		}
		base.ket = base.cursor;
		among_var = base.find_among_b(a_2);
		if (among_var == 0) {
			return false;
		}
		base.bra = base.cursor;
		switch (among_var) {
			case 1:
				if (!base.slice_from('ss')) {
					return false;
				}
				break;
			case 2:
				lab1: {
					var /** number */ v_2 = base.limit - base.cursor;
					lab2: {
						{
							var /** number */ c1 = base.cursor - 2;
							if (c1 < base.limit_backward) {
								break lab2;
							}
							base.cursor = c1;
						}
						if (!base.slice_from('i')) {
							return false;
						}
						break lab1;
					}
					base.cursor = base.limit - v_2;
					if (!base.slice_from('ie')) {
						return false;
					}
				}
				break;
			case 3:
				if (base.cursor <= base.limit_backward) {
					return false;
				}
				base.cursor--;
				golab3: while (true) {
					lab4: {
						if (!base.in_grouping_b(g_v, 97, 121)) {
							break lab4;
						}
						break golab3;
					}
					if (base.cursor <= base.limit_backward) {
						return false;
					}
					base.cursor--;
				}
				if (!base.slice_del()) {
					return false;
				}
				break;
		}
		return true;
	}

	/** @return {boolean} */
	function r_Step_1b() {
		var /** number */ among_var;
		base.ket = base.cursor;
		among_var = base.find_among_b(a_4);
		if (among_var == 0) {
			return false;
		}
		base.bra = base.cursor;
		switch (among_var) {
			case 1:
				if (!r_R1()) {
					return false;
				}
				if (!base.slice_from('ee')) {
					return false;
				}
				break;
			case 2:
				var /** number */ v_1 = base.limit - base.cursor;
				golab0: while (true) {
					lab1: {
						if (!base.in_grouping_b(g_v, 97, 121)) {
							break lab1;
						}
						break golab0;
					}
					if (base.cursor <= base.limit_backward) {
						return false;
					}
					base.cursor--;
				}
				base.cursor = base.limit - v_1;
				if (!base.slice_del()) {
					return false;
				}
				base.ket = base.cursor;
				base.bra = base.cursor;
				var /** number */ v_3 = base.limit - base.cursor;
				among_var = base.find_among_b(a_3);
				switch (among_var) {
					case 1:
						if (!base.slice_from('e')) {
							return false;
						}
						return false;
					case 2:
						{
							var /** number */ v_4 = base.limit - base.cursor;
							lab2: {
								if (!base.in_grouping_b(g_aeo, 97, 111)) {
									break lab2;
								}
								if (base.cursor > base.limit_backward) {
									break lab2;
								}
								return false;
							}
							base.cursor = base.limit - v_4;
						}
						break;
					case 3:
						if (base.cursor != I_p1) {
							return false;
						}
						var /** number */ v_5 = base.limit - base.cursor;
						if (!r_shortv()) {
							return false;
						}
						base.cursor = base.limit - v_5;
						if (!base.slice_from('e')) {
							return false;
						}
						return false;
				}
				base.cursor = base.limit - v_3;
				base.ket = base.cursor;
				if (base.cursor <= base.limit_backward) {
					return false;
				}
				base.cursor--;
				base.bra = base.cursor;
				if (!base.slice_del()) {
					return false;
				}
				break;
		}
		return true;
	}

	/** @return {boolean} */
	function r_Step_1c() {
		base.ket = base.cursor;
		lab0: {
			var /** number */ v_1 = base.limit - base.cursor;
			lab1: {
				if (!base.eq_s_b('y')) {
					break lab1;
				}
				break lab0;
			}
			base.cursor = base.limit - v_1;
			if (!base.eq_s_b('Y')) {
				return false;
			}
		}
		base.bra = base.cursor;
		if (!base.out_grouping_b(g_v, 97, 121)) {
			return false;
		}
		lab2: {
			if (base.cursor > base.limit_backward) {
				break lab2;
			}
			return false;
		}
		if (!base.slice_from('i')) {
			return false;
		}
		return true;
	}

	/** @return {boolean} */
	function r_Step_2() {
		var /** number */ among_var;
		base.ket = base.cursor;
		among_var = base.find_among_b(a_5);
		if (among_var == 0) {
			return false;
		}
		base.bra = base.cursor;
		if (!r_R1()) {
			return false;
		}
		switch (among_var) {
			case 1:
				if (!base.slice_from('tion')) {
					return false;
				}
				break;
			case 2:
				if (!base.slice_from('ence')) {
					return false;
				}
				break;
			case 3:
				if (!base.slice_from('ance')) {
					return false;
				}
				break;
			case 4:
				if (!base.slice_from('able')) {
					return false;
				}
				break;
			case 5:
				if (!base.slice_from('ent')) {
					return false;
				}
				break;
			case 6:
				if (!base.slice_from('ize')) {
					return false;
				}
				break;
			case 7:
				if (!base.slice_from('ate')) {
					return false;
				}
				break;
			case 8:
				if (!base.slice_from('al')) {
					return false;
				}
				break;
			case 9:
				if (!base.slice_from('ful')) {
					return false;
				}
				break;
			case 10:
				if (!base.slice_from('ous')) {
					return false;
				}
				break;
			case 11:
				if (!base.slice_from('ive')) {
					return false;
				}
				break;
			case 12:
				if (!base.slice_from('ble')) {
					return false;
				}
				break;
			case 13:
				if (!base.eq_s_b('l')) {
					return false;
				}
				if (!base.slice_from('og')) {
					return false;
				}
				break;
			case 14:
				if (!base.slice_from('less')) {
					return false;
				}
				break;
			case 15:
				if (!base.in_grouping_b(g_valid_LI, 99, 116)) {
					return false;
				}
				if (!base.slice_del()) {
					return false;
				}
				break;
		}
		return true;
	}

	/** @return {boolean} */
	function r_Step_3() {
		var /** number */ among_var;
		base.ket = base.cursor;
		among_var = base.find_among_b(a_6);
		if (among_var == 0) {
			return false;
		}
		base.bra = base.cursor;
		if (!r_R1()) {
			return false;
		}
		switch (among_var) {
			case 1:
				if (!base.slice_from('tion')) {
					return false;
				}
				break;
			case 2:
				if (!base.slice_from('ate')) {
					return false;
				}
				break;
			case 3:
				if (!base.slice_from('al')) {
					return false;
				}
				break;
			case 4:
				if (!base.slice_from('ic')) {
					return false;
				}
				break;
			case 5:
				if (!base.slice_del()) {
					return false;
				}
				break;
			case 6:
				if (!r_R2()) {
					return false;
				}
				if (!base.slice_del()) {
					return false;
				}
				break;
		}
		return true;
	}

	/** @return {boolean} */
	function r_Step_4() {
		var /** number */ among_var;
		base.ket = base.cursor;
		among_var = base.find_among_b(a_7);
		if (among_var == 0) {
			return false;
		}
		base.bra = base.cursor;
		if (!r_R2()) {
			return false;
		}
		switch (among_var) {
			case 1:
				if (!base.slice_del()) {
					return false;
				}
				break;
			case 2:
				lab0: {
					var /** number */ v_1 = base.limit - base.cursor;
					lab1: {
						if (!base.eq_s_b('s')) {
							break lab1;
						}
						break lab0;
					}
					base.cursor = base.limit - v_1;
					if (!base.eq_s_b('t')) {
						return false;
					}
				}
				if (!base.slice_del()) {
					return false;
				}
				break;
		}
		return true;
	}

	/** @return {boolean} */
	function r_Step_5() {
		var /** number */ among_var;
		base.ket = base.cursor;
		among_var = base.find_among_b(a_8);
		if (among_var == 0) {
			return false;
		}
		base.bra = base.cursor;
		switch (among_var) {
			case 1:
				lab0: {
					var /** number */ v_1 = base.limit - base.cursor;
					lab1: {
						if (!r_R2()) {
							break lab1;
						}
						break lab0;
					}
					base.cursor = base.limit - v_1;
					if (!r_R1()) {
						return false;
					}
					{
						var /** number */ v_2 = base.limit - base.cursor;
						lab2: {
							if (!r_shortv()) {
								break lab2;
							}
							return false;
						}
						base.cursor = base.limit - v_2;
					}
				}
				if (!base.slice_del()) {
					return false;
				}
				break;
			case 2:
				if (!r_R2()) {
					return false;
				}
				if (!base.eq_s_b('l')) {
					return false;
				}
				if (!base.slice_del()) {
					return false;
				}
				break;
		}
		return true;
	}

	/** @return {boolean} */
	function r_exception2() {
		base.ket = base.cursor;
		if (base.find_among_b(a_9) == 0) {
			return false;
		}
		base.bra = base.cursor;
		if (base.cursor > base.limit_backward) {
			return false;
		}
		return true;
	}

	/** @return {boolean} */
	function r_exception1() {
		var /** number */ among_var;
		base.bra = base.cursor;
		among_var = base.find_among(a_10);
		if (among_var == 0) {
			return false;
		}
		base.ket = base.cursor;
		if (base.cursor < base.limit) {
			return false;
		}
		switch (among_var) {
			case 1:
				if (!base.slice_from('ski')) {
					return false;
				}
				break;
			case 2:
				if (!base.slice_from('sky')) {
					return false;
				}
				break;
			case 3:
				if (!base.slice_from('die')) {
					return false;
				}
				break;
			case 4:
				if (!base.slice_from('lie')) {
					return false;
				}
				break;
			case 5:
				if (!base.slice_from('tie')) {
					return false;
				}
				break;
			case 6:
				if (!base.slice_from('idl')) {
					return false;
				}
				break;
			case 7:
				if (!base.slice_from('gentl')) {
					return false;
				}
				break;
			case 8:
				if (!base.slice_from('ugli')) {
					return false;
				}
				break;
			case 9:
				if (!base.slice_from('earli')) {
					return false;
				}
				break;
			case 10:
				if (!base.slice_from('onli')) {
					return false;
				}
				break;
			case 11:
				if (!base.slice_from('singl')) {
					return false;
				}
				break;
		}
		return true;
	}

	/** @return {boolean} */
	function r_postlude() {
		if (!B_Y_found) {
			return false;
		}
		while (true) {
			var /** number */ v_1 = base.cursor;
			lab0: {
				golab1: while (true) {
					var /** number */ v_2 = base.cursor;
					lab2: {
						base.bra = base.cursor;
						if (!base.eq_s('Y')) {
							break lab2;
						}
						base.ket = base.cursor;
						base.cursor = v_2;
						break golab1;
					}
					base.cursor = v_2;
					if (base.cursor >= base.limit) {
						break lab0;
					}
					base.cursor++;
				}
				if (!base.slice_from('y')) {
					return false;
				}
				continue;
			}
			base.cursor = v_1;
			break;
		}
		return true;
	}

	this.stem = /** @return {boolean} */ function () {
		lab0: {
			var /** number */ v_1 = base.cursor;
			lab1: {
				if (!r_exception1()) {
					break lab1;
				}
				break lab0;
			}
			base.cursor = v_1;
			lab2: {
				{
					var /** number */ v_2 = base.cursor;
					lab3: {
						{
							var /** number */ c1 = base.cursor + 3;
							if (c1 > base.limit) {
								break lab3;
							}
							base.cursor = c1;
						}
						break lab2;
					}
					base.cursor = v_2;
				}
				break lab0;
			}
			base.cursor = v_1;
			r_prelude();
			r_mark_regions();
			base.limit_backward = base.cursor;
			base.cursor = base.limit;
			var /** number */ v_5 = base.limit - base.cursor;
			r_Step_1a();
			base.cursor = base.limit - v_5;
			lab4: {
				var /** number */ v_6 = base.limit - base.cursor;
				lab5: {
					if (!r_exception2()) {
						break lab5;
					}
					break lab4;
				}
				base.cursor = base.limit - v_6;
				var /** number */ v_7 = base.limit - base.cursor;
				r_Step_1b();
				base.cursor = base.limit - v_7;
				var /** number */ v_8 = base.limit - base.cursor;
				r_Step_1c();
				base.cursor = base.limit - v_8;
				var /** number */ v_9 = base.limit - base.cursor;
				r_Step_2();
				base.cursor = base.limit - v_9;
				var /** number */ v_10 = base.limit - base.cursor;
				r_Step_3();
				base.cursor = base.limit - v_10;
				var /** number */ v_11 = base.limit - base.cursor;
				r_Step_4();
				base.cursor = base.limit - v_11;
				var /** number */ v_12 = base.limit - base.cursor;
				r_Step_5();
				base.cursor = base.limit - v_12;
			}
			base.cursor = base.limit_backward;
			var /** number */ v_13 = base.cursor;
			r_postlude();
			base.cursor = v_13;
		}
		return true;
	};

	/**@return{string}*/
	this['stemWord'] = function (/**string*/ word) {
		base.setCurrent(word);
		this.stem();
		return base.getCurrent();
	};
};

/**
 * Custom rules applied to the snowball stemming algorithm.
 *
 * The goal of each rule is to ensure all stemmed word is still a partial match
 * of the original word, which works better with the emoji search algorithm.
 * For example, snowball stemming changes "smiling" to "smile" by default, which
 * would make "smiling".startsWith("smile") false. This isn't ideal for emoji
 * search algorithm as it can cause no match, so we over-stem it to "smil" instead.
 * The implication is that the resulting stemmed word might not be a word anymore.
 *
 * Each rule has 3 items. The first item is the word's suffix to match,
 * the second item is the stemmed word's suffix to match, and the third item
 * is the slice end to apply to the original word that would be returned as
 * result if the first 2 items are matched. undefined in slice end means to
 * return the original word without modification.
 *
 * xxx occurrences is computed based on running the algorithm to 370k words in
 * https://github.com/dwyl/english-words/blob/master/words_dictionary.json
 */
export const CUSTOM_RULES = [
	['y', 'i', undefined], // "happy" 	-> "happi"	, we want "happy" (15988 occurrences)
	['Y', 'i', undefined], // "DIY" 	-> "DIi"	, we want "DIY"   (3 occurrences in Emoji Keywords dataset)
	['ying', 'i', -3], //     "crying"  -> "cri"	, we want "cry"   (624 occurrences)
	['yings', 'i', -4], //    "carryings" -> "carri", we want "carry" (5 occurrences)
	['ing', 'e', -3], //      "smiling"   -> "smile", we want "smil"  (588 occurrences)
	['ings', 'e', -4], //     "codings"   -> "code"	, we want "cod"   (109 occurrences)
	['ingly', 'e', -5], //    "blazingly" -> "blaze", we want "blaz"  (94 occurrences)
	['ility', 'l', -4], //    "disability"-> "disabl", we want "disabi" (483 occurrences)
	['ilities', 'l', -6], //  "capabilities" -> "capabl", we want "capabi" (76 occurrences)
	['ys', 'i', -1], //       "candys"  -> "candi"	, we want "candy" (99 occurrences)
	['est', 'est', -3], //    "coolest" -> "coolest"	, we want "cool" (2035 occurrences)
] as const;

const stemmer = new EnglishStemmer();

/**
 * Stem a word using the snowball stemming algorithm.
 *
 * 11 custom rules are applied to make it work better with the emoji search algorithm.
 *
 * Snowball reference: https://snowballstem.org/texts/introduction.html
 *
 * In local testing, stemWord takes ~550ms to stem 370k words (673 words/ms).
 */
export const stemWord = (word: string) => {
	const stemmedWord = stemmer.stemWord(word) as string;

	for (const [wordSuffix, stemmedWordSuffix, sliceEnd] of CUSTOM_RULES) {
		if (word.endsWith(wordSuffix) && stemmedWord.endsWith(stemmedWordSuffix)) {
			return word.slice(0, sliceEnd);
		}
	}

	return stemmedWord;
};
