import {Dimensions, StyleSheet} from 'react-native';

const screenWidth = Dimensions.get('window').width;

export const styles = StyleSheet.create({
    container: {padding: 20},



    pinnedImageBubble: {
        borderWidth: 2,
        borderColor: '#0b43d6',
        borderRadius: 8,
        position: 'relative',
    },

    pinIconOverlay: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 2,
    },


    chatContainer: {
        padding: 10,
        gap: 10,
        flexDirection: 'column',
    },

    imageBubble: {
        alignSelf: 'flex-end',
        backgroundColor: '#eae9e9',
        borderRadius: 12,
        padding: 5,
        width: screenWidth * 0.6,

    },

    imageWrapper: {
        width: '100%',
        aspectRatio: 1,
    },

    image: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    imageDescription: {
        color: '#555',
        fontSize: 12,
        paddingTop: 4,
        paddingHorizontal: 6,
        textAlign: 'left',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
    },
    buttonText: {
        color: '#fff',
        textAlign: 'center',
    },

    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 0,
        paddingBottom: 0,
        borderWidth: 0,
        overflow: 'hidden',
    },

    input: {
        flex: 1,
        paddingLeft: 10,
        fontSize: 18
    },

    iconButton: {
        backgroundColor: 'rgba(0,0,0,0)',
        paddingHorizontal: 10,
        paddingBottom: 10
    }


});
