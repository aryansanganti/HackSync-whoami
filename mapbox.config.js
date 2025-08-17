module.exports = {
    dependency: {
        platforms: {
            android: {
                sourceDir: './android',
                packageImportPath: 'import com.rnmapbox.maps.RNMapboxMapsPackage;',
                packageInstance: 'new RNMapboxMapsPackage()',
            },
        },
    },
};
