<?php
/**
 * Plugin Name: Quick Tags
 * Plugin URI: http://monkeyr.com/wp/quicktags
 * Description: Adds controls to directly add and remove tags from the Posts and Media lists within the admin area.
 * Text Domain: quick-tags
 * Version: 1.0
 * Author: mhume
 * Author URI: http://monkeyr.com
 * License: GPLv2
 */

defined('ABSPATH') or die();

if( !defined( 'QUICK_TAGS_VERSION' ) ) {
	define( 'QUICK_TAGS_VERSION', '1.0' );
}

include_once('quick-tags-cls.php');

function quick_tags_init() {
	new QuickTags;
}
add_action('plugins_loaded', 'quick_tags_init');

function quick_tags_plugin_deactivation(){
	delete_option('quick_tags_version');
}
register_deactivation_hook( __FILE__, 'quick_tags_plugin_deactivation' );


?>