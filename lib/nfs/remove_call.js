// Copyright 2013 Joyent, Inc.  All rights reserved.
//
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
// 3.3.12 Procedure 12: REMOVE - Remove a File
//
//   SYNOPSIS
//
//      REMOVE3res NFSPROC3_REMOVE(REMOVE3args) = 12;
//
//      struct REMOVE3args {
//           diropargs3  object;
//      };
//
//      struct REMOVE3resok {
//           wcc_data    dir_wcc;
//      };
//
//      struct REMOVE3resfail {
//           wcc_data    dir_wcc;
//      };
//
//      union REMOVE3res switch (nfsstat3 status) {
//      case NFS3_OK:
//           REMOVE3resok   resok;
//      default:
//           REMOVE3resfail resfail;
//      };
//
//   DESCRIPTION
//
//      Procedure REMOVE removes (deletes) an entry from a
//      directory. If the entry in the directory was the last
//      reference to the corresponding file system object, the
//      object may be destroyed.  On entry, the arguments in
//      REMOVE3args are:
//
//      object
//         A diropargs3 structure identifying the entry to be
//         removed:
//
//      dir
//         The file handle for the directory from which the entry
//         is to be removed.
//
//      name
//         The name of the entry to be removed. Refer to General
//         comments on filenames on page 30.
//
//      On successful return, REMOVE3res.status is NFS3_OK and
//      REMOVE3res.resok contains:
//
//      dir_wcc
//         Weak cache consistency data for the directory,
//         object.dir.  For a client that requires only the
//         post-REMOVE directory attributes, these can be found in
//         dir_wcc.after.
//
//      Otherwise, REMOVE3res.status contains the error on failure
//      and REMOVE3res.resfail contains the following:
//
//      dir_wcc
//         Weak cache consistency data for the directory,
//         object.dir.  For a client that requires only the
//         post-REMOVE directory attributes, these can be found in
//         dir_wcc.after. Even though the REMOVE failed, full
//         wcc_data is returned to allow the client to determine
//         whether the failing REMOVE changed the directory.
//
//   IMPLEMENTATION
//
//      In general, REMOVE is intended to remove non-directory
//      file objects and RMDIR is to be used to remove
//      directories.  However, REMOVE can be used to remove
//      directories, subject to restrictions imposed by either the
//      client or server interfaces.  This had been a source of
//      confusion in the NFS version 2 protocol.
//
//      The concept of last reference is server specific. However,
//      if the nlink field in the previous attributes of the
//      object had the value 1, the client should not rely on
//      referring to the object via a file handle. Likewise, the
//      client should not rely on the resources (disk space,
//      directory entry, and so on.) formerly associated with the
//      object becoming immediately available. Thus, if a client
//      needs to be able to continue to access a file after using
//      REMOVE to remove it, the client should take steps to make
//      sure that the file will still be accessible. The usual
//      mechanism used is to use RENAME to rename the file from
//      its old name to a new hidden name.
//
//      Refer to General comments on filenames on page 30.
//
//   ERRORS
//
//      NFS3ERR_NOENT
//      NFS3ERR_IO
//      NFS3ERR_ACCES
//      NFS3ERR_NOTDIR
//      NFS3ERR_NAMETOOLONG
//      NFS3ERR_ROFS
//      NFS3ERR_STALE
//      NFS3ERR_BADHANDLE
//      NFS3ERR_SERVERFAULT
//
//   SEE ALSO
//
//      RMDIR and RENAME.


var util = require('util');

var assert = require('assert-plus');
var rpc = require('oncrpc');

var NfsCall = require('./nfs_call').NfsCall;



///--- Globals

var XDR = rpc.XDR;



///--- API

function RemoveCall(opts) {
    assert.object(opts, 'opts');
    assert.optionalObject(opts.object, 'opts.object');

    NfsCall.call(this, opts, true);

    this._object = opts.object || {
        dir: '',
        name: ''
    };

    this._nfs_remove_call = true; // MDB
}
util.inherits(RemoveCall, NfsCall);
Object.defineProperty(RemoveCall.prototype, 'object', {
    get: function object() {
        return (this._object.dir);
    }
});


RemoveCall.prototype._transform = function _transform(chunk, enc, cb) {
    if (this.incoming) {
        var xdr = new XDR(chunk);
        this._object.dir = xdr.readString();
        this._object.name = xdr.readString();
    } else {
        this.push(chunk);
    }

    cb();
};


RemoveCall.prototype.writeHead = function writeHead() {
    var len = XDR.byteLength(this._object.dir) +
        XDR.byteLength(this._object.name);

    var xdr = this._serialize(len);

    xdr.writeString(this._object.dir);
    xdr.writeString(this._object.name);

    this.write(xdr.buffer());
};


RemoveCall.prototype.toString = function toString() {
    var fmt = '[object RemoveCall <xid=%d, object=%j>]';
    return (util.format(fmt, this.xid, this._object));
};



///--- Exports

module.exports = {
    RemoveCall: RemoveCall
};
