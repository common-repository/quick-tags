<?php

class QuickTags{
	// Initializes the plugin
	function __construct() {
		global $pagenow;
		
		load_plugin_textdomain('quick-tags', false, basename( dirname( __FILE__ ) ) . '/languages' );
		add_action('wp_ajax_quickTags', array($this, 'ajax_post'));

		if(in_array($pagenow, array('upload.php','edit.php'))) {
			add_action('admin_enqueue_scripts', array($this, 'enqueue_scripts'));
			add_action('admin_print_scripts', array($this, 'enqueue_script_params'));
			//add_action('admin_notices', array($this, 'plugin_activation'));
		}
	}

	function ajax_post(){
		$post = array_merge(array('method'=>''), $_POST);
		switch ($post['method']) {
			case 'delete':
				list($nul, $id) = explode('-', $post['id']);
				$post = array_merge($post, $this->del_tag_from_media((int)$id, $post['term']));
				$ret = array_intersect_key($post, array_flip(array('id','term','success','msg','terms')));
				echo json_encode((object)$ret);
				break;

			case 'add':
				list($nul, $id) = explode('-', $post['id']);
				$post = array_merge($post, $this->add_tag_from_media((int)$id, $post['terms']));
				$ret = array_intersect_key($post, array_flip(array('id','success','msg','terms')));
				echo json_encode((object)$ret);
				break;

			default:
				echo '{"msg":"'. esc_attr__( 'I don\'t understand the request!', 'quick-tags' ) .'"}';
				break;
		}
		exit;
	}

	function plugin_activation(){
		if(QUICK_TAGS_VERSION != get_option('quick_tags_version')){
			add_option('quick_tags_version', QUICK_TAGS_VERSION);
			echo '<div class="updated" id="message2"><p>Quick Tags '. esc_attr__( 'plugin', 'quick-tags' ) .' <strong>'. esc_attr__( 'activated', 'quick-tags' ) .'</strong>.</p></div>';
		}
	}

	function enqueue_scripts($hook){
		if(in_array($hook, array('upload.php','edit.php'))){
			//wp_enqueue_script( 'boot_strap', '//getbootstrap.com/dist/js/bootstrap.js', array( 'jquery' ) );
			//wp_enqueue_script( 'boot_box', plugin_dir_url( __FILE__ ) . 'bootbox.min.js', array( 'jquery', 'boot_strap' ) );
			wp_enqueue_script( 'quick_tags_script', plugin_dir_url( __FILE__ ) . 'quick-tags.js', array( 'jquery', 'suggest' ) );
			wp_enqueue_style( 'quick_tags_css', plugin_dir_url( __FILE__ ) . 'quick-tags.css' );
			//wp_enqueue_style( 'boot_strap_css', '//getbootstrap.com/dist/css/bootstrap.css' );
		}
	}

	function enqueue_script_params(){
		global $pagenow;
		$hrefs = array(
			'upload.php'	=> 'upload.php?taxonomy=post_tag&term=',
			'edit.php'		=> 'edit.php?tag='
		);
		$params = array(
			'comma'					=> __( ',', 'tag delimiter' ),
			'add_label'			=> esc_attr__('Add'),
			'tag_href_base'	=> $hrefs[$pagenow]
		);
		wp_localize_script( 'quick_tags_script', 'quickTagsArgs', $params );
	}

	function del_tag_from_media($post_ID, $term, $taxonomy = 'post_tag'){
		$tags = wp_get_post_terms($post_ID);
		$terms = array(); $found = false;
		foreach($tags as $tag){
			if($term == $tag->slug)
				$found = true;
			else
				$terms[] = $tag->slug;
		}

		$ret = array('success'=>false);
		if($found){
			$taxonomy_obj = get_taxonomy($taxonomy);
			if ( current_user_can($taxonomy_obj->cap->assign_terms) ){
				wp_set_post_terms( $post_ID, $terms, $taxonomy );
				$ret['success'] = true;
			}
			else
				$ret['msg'] = esc_attr__( 'Current user cannot assign tags!', 'quick-tags' );
		}
		else
			$ret['msg'] = esc_attr__( 'Tag not found!', 'quick-tags' );
		

		$ret['terms'] = array();
		foreach(wp_get_post_terms($post_ID) as $tag){
			$ret['terms'][] = array(
				'slug' => $tag->slug,
				'name' => $tag->name
			);
		}
		return $ret;
	}

	function add_tag_from_media($post_ID, $term, $taxonomy = 'post_tag'){
		$ret = array('success'=>false);
		$taxonomy_obj = get_taxonomy($taxonomy);
		if ( current_user_can($taxonomy_obj->cap->assign_terms) ){
			wp_set_post_terms( $post_ID, $term, $taxonomy );
			$ret['success'] = true;
		}
		else
			$ret['msg'] = esc_attr__( 'Current user cannot assign tags!', 'quick-tags' );

		$ret['terms'] = array();
		foreach(wp_get_post_terms($post_ID) as $tag){
			$ret['terms'][] = array(
				'slug' => $tag->slug,
				'name' => $tag->name
			);
		}
		return $ret;
	}
}

?>